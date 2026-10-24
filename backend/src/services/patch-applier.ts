import fs from 'fs';
import path from 'path';
import os from 'os';
import { RepoFile, Session } from '../schemas/session.schema.js';
import { isPathSafe } from './repo-ingestion.js';

export async function createIsolatedWorkspace(sessionId: string, files: RepoFile[]): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `repomedic-temp-${sessionId}-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  for (const file of files) {
    if (!isPathSafe(file.path)) {
      throw new Error(`Unsafe path rejected during workspace creation: ${file.path}`);
    }

    const fullPath = path.join(tempDir, file.path);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(fullPath, file.content, 'utf-8');
  }

  return tempDir;
}

export async function applyPatchToWorkspace(
  workspaceDir: string,
  session: Session
): Promise<{ modifiedFiles: string[] }> {
  if (!session.patchApproved) {
    throw new Error('Patch cannot be applied without explicit human approval.');
  }

  if (!session.patchProposal || session.patchProposal.hunks.length === 0) {
    throw new Error('No patch hunks available to apply.');
  }

  const modifiedFiles: string[] = [];

  for (const hunk of session.patchProposal.hunks) {
    if (!isPathSafe(hunk.file)) {
      throw new Error(`Unsafe file path in patch proposal: ${hunk.file}`);
    }

    const targetPath = path.join(workspaceDir, hunk.file);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Target file does not exist in workspace: ${hunk.file}`);
    }

    const currentContent = fs.readFileSync(targetPath, 'utf-8');
    const lines = currentContent.split('\n');

    // Replace the specified line range
    const beforeLines = lines.slice(0, hunk.startLine - 1);
    const afterLines = lines.slice(hunk.endLine);
    const newContent = [...beforeLines, hunk.replacementCode, ...afterLines].join('\n');

    fs.writeFileSync(targetPath, newContent, 'utf-8');
    if (!modifiedFiles.includes(hunk.file)) {
      modifiedFiles.push(hunk.file);
    }
  }

  // Also apply regression test file if included in patch proposal
  if (session.patchProposal.regressionTest) {
    const regTest = session.patchProposal.regressionTest;
    if (isPathSafe(regTest.file)) {
      const regPath = path.join(workspaceDir, regTest.file);
      const parent = path.dirname(regPath);
      if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent, { recursive: true });
      }
      if (fs.existsSync(regPath)) {
        // Append test
        const existing = fs.readFileSync(regPath, 'utf-8');
        fs.writeFileSync(regPath, `${existing}\n\n// Added by RepoMedic AI regression test generator:\n${regTest.testCode}`, 'utf-8');
      } else {
        fs.writeFileSync(regPath, regTest.testCode, 'utf-8');
      }
    }
  }

  return { modifiedFiles };
}
