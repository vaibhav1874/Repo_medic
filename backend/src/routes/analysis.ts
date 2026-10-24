import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { sessionStore } from '../services/session-store.js';
import { ingestGitHubUrl, ingestZipBuffer } from '../services/repo-ingestion.js';
import { runStaticAnalysis } from '../services/static-analysis.js';
import { selectModelContext } from '../services/context-selector.js';
import { generateDiagnosis } from '../services/model-provider.js';
import { createPatchProposal } from '../services/patch-generator.js';
import { RepoFile, Session } from '../schemas/session.schema.js';

export const analysisRouter = Router();

function getSampleFiles(): RepoFile[] {
  const sampleDir = path.resolve(process.cwd(), 'sample');
  const files: RepoFile[] = [];

  function walk(dir: string, baseDir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        walk(fullPath, baseDir);
      } else {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const ext = path.extname(entry.name);
        const language = ext === '.ts' ? 'typescript' : ext === '.json' ? 'json' : 'plaintext';
        files.push({
          path: relPath,
          content,
          size: Buffer.byteLength(content, 'utf-8'),
          language,
          isRedacted: false,
        });
      }
    }
  }

  if (fs.existsSync(sampleDir)) {
    walk(sampleDir, sampleDir);
  }

  return files;
}

analysisRouter.post('/', async (req, res, next) => {
  try {
    const { sourceType, target, zipBase64, issueDescription } = req.body;

    if (!sourceType || !['github_url', 'zip_upload', 'sample_project'].includes(sourceType)) {
      return res.status(400).json({
        error: 'Invalid sourceType. Expected "github_url", "zip_upload", or "sample_project".',
      });
    }

    let files: RepoFile[] = [];
    let repoIdentifier = 'sample-calculator';
    let secretsCount = 0;

    if (sourceType === 'sample_project') {
      files = getSampleFiles();
      repoIdentifier = 'repo-medic/sample-calculator';
    } else if (sourceType === 'github_url') {
      if (!target || typeof target !== 'string') {
        return res.status(400).json({ error: 'GitHub repository URL is required.' });
      }
      repoIdentifier = target;
      const result = await ingestGitHubUrl(target);
      files = result.files;
      secretsCount = result.secretsCount;
    } else if (sourceType === 'zip_upload') {
      if (!zipBase64 || typeof zipBase64 !== 'string') {
        return res.status(400).json({ error: 'ZIP file base64 data is required.' });
      }
      const buffer = Buffer.from(zipBase64, 'base64');
      repoIdentifier = target || 'uploaded-archive.zip';
      const result = await ingestZipBuffer(buffer);
      files = result.files;
      secretsCount = result.secretsCount;
    }

    if (files.length === 0) {
      return res.status(400).json({ error: 'Repository contains no inspectable source files.' });
    }

    // 1. Run deterministic static analysis
    const staticFindings = runStaticAnalysis(files);

    // 2. Select bounded context for model
    const contextSelection = selectModelContext(files, issueDescription || '', staticFindings);

    const findingsSummary = staticFindings
      .slice(0, 10)
      .map((f) => `- [${f.severity.toUpperCase()}] ${f.file}:${f.line} ${f.message}`)
      .join('\n');

    // 3. Generate diagnosis with Nebius / NVIDIA model
    const diagnosis = await generateDiagnosis(
      issueDescription || '',
      contextSelection.promptContextString,
      findingsSummary || 'No deterministic findings.'
    );

    // 4. Generate proposed patch
    const patchProposal = await createPatchProposal(
      issueDescription || '',
      diagnosis,
      files
    );

    // 5. Calculate repository health metrics
    const languages: Record<string, number> = {};
    for (const f of files) {
      languages[f.language] = (languages[f.language] || 0) + 1;
    }

    const findingsBySeverity: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const f of staticFindings) {
      findingsBySeverity[f.severity] = (findingsBySeverity[f.severity] || 0) + 1;
    }

    const hasTests = files.some((f) =>
      /(?:test|spec)\.(?:ts|js|py)$/.test(f.path) || f.path.includes('test')
    );

    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceType,
      repoIdentifier,
      issueDescription: issueDescription || '',
      files,
      staticFindings,
      diagnosis,
      patchProposal,
      patchApproved: false,
      healthMetrics: {
        totalFiles: files.length,
        languages,
        findingsBySeverity,
        hasTests,
        secretsDetectedCount: secretsCount,
      },
    };

    sessionStore.set(session);

    return res.status(201).json({
      sessionId,
      repoIdentifier,
      filesCount: files.length,
      staticFindingsCount: staticFindings.length,
      diagnosis,
      patchProposal,
      healthMetrics: session.healthMetrics,
    });
  } catch (err: any) {
    next(err);
  }
});

analysisRouter.get('/:sessionId', (req, res) => {
  const session = sessionStore.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  // Return session details (strip full raw files from summary list for performance)
  res.json({
    id: session.id,
    createdAt: session.createdAt,
    repoIdentifier: session.repoIdentifier,
    sourceType: session.sourceType,
    issueDescription: session.issueDescription,
    files: session.files.map((f) => ({ path: f.path, size: f.size, language: f.language })),
    staticFindings: session.staticFindings,
    diagnosis: session.diagnosis,
    patchProposal: session.patchProposal,
    patchApproved: session.patchApproved,
    verification: session.verification,
    healthMetrics: session.healthMetrics,
  });
});

analysisRouter.get('/:sessionId/file', (req, res) => {
  const session = sessionStore.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  const filePath = req.query.path as string;
  if (!filePath) {
    return res.status(400).json({ error: 'File path query parameter is required.' });
  }

  const file = session.files.find((f) => f.path === filePath);
  if (!file) {
    return res.status(404).json({ error: 'File not found in session repository.' });
  }

  res.json({ path: file.path, content: file.content, language: file.language });
});
