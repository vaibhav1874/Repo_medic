import { createTwoFilesPatch } from 'diff';
import { RepoFile } from '../schemas/session.schema.js';
import { DiagnosisResult } from '../schemas/diagnosis.schema.js';
import { PatchProposal, PatchHunk } from '../schemas/patch.schema.js';
import { generatePatchProposal as modelGeneratePatch } from './model-provider.js';

export function validatePatchHunk(hunk: PatchHunk, files: RepoFile[]): void {
  const targetFile = files.find((f) => f.path === hunk.file);
  if (!targetFile) {
    throw new Error(`Patch targets non-existent file in repository: ${hunk.file}`);
  }

  const lines = targetFile.content.split('\n');
  if (hunk.startLine < 1 || hunk.startLine > lines.length) {
    throw new Error(
      `Patch startLine ${hunk.startLine} is out of bounds for ${hunk.file} (1-${lines.length})`
    );
  }

  if (hunk.endLine < hunk.startLine || hunk.endLine > lines.length) {
    throw new Error(
      `Patch endLine ${hunk.endLine} is out of bounds for ${hunk.file} (must be between ${hunk.startLine} and ${lines.length})`
    );
  }
}

export function buildUnifiedDiff(
  filePath: string,
  originalContent: string,
  patchedContent: string
): string {
  return createTwoFilesPatch(
    `a/${filePath}`,
    `b/${filePath}`,
    originalContent,
    patchedContent,
    'original',
    'patched',
    { context: 3 }
  );
}

export async function createPatchProposal(
  issueDescription: string,
  diagnosis: DiagnosisResult,
  files: RepoFile[]
): Promise<PatchProposal> {
  // Identify primary target file from evidence or primary finding
  let primaryFile = diagnosis.evidence[0]?.file;
  if (!primaryFile && diagnosis.findings[0]?.file) {
    primaryFile = diagnosis.findings[0].file;
  }
  if (!primaryFile && files.length > 0) {
    primaryFile = files[0].path;
  }

  const targetFileObj = files.find((f) => f.path === primaryFile);
  const targetContent = targetFileObj ? targetFileObj.content : '';

  const proposal = await modelGeneratePatch(
    issueDescription,
    diagnosis,
    targetContent,
    primaryFile || 'unknown.ts'
  );

  // Validate hunks
  for (const hunk of proposal.hunks) {
    validatePatchHunk(hunk, files);
  }

  // If proposal unifiedDiff is missing or basic, generate it accurately with diff package
  if (targetFileObj && proposal.hunks.length > 0) {
    let patchedText = targetFileObj.content;
    for (const hunk of proposal.hunks) {
      if (hunk.file === targetFileObj.path) {
        const lines = patchedText.split('\n');
        const before = lines.slice(0, hunk.startLine - 1);
        const after = lines.slice(hunk.endLine);
        patchedText = [...before, hunk.replacementCode, ...after].join('\n');
      }
    }
    proposal.unifiedDiff = buildUnifiedDiff(targetFileObj.path, targetFileObj.content, patchedText);
  }

  return proposal;
}
