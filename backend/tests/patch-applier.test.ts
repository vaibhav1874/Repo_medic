import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createIsolatedWorkspace, applyPatchToWorkspace } from '../src/services/patch-applier.js';
import { validatePatchHunk } from '../src/services/patch-generator.js';
import { Session, RepoFile } from '../schemas/session.schema.js';

describe('Patch Applier & Workspace Isolation', () => {
  const initialFiles: RepoFile[] = [
    {
      path: 'src/calc.ts',
      language: 'typescript',
      size: 150,
      content: 'export function sum() {\n  let i = 1;\n  return i;\n}',
      isRedacted: false,
    },
  ];

  it('blocks patch application if patch is not approved', async () => {
    const session: Session = {
      id: 'test-session-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceType: 'sample_project',
      repoIdentifier: 'test-repo',
      issueDescription: '',
      files: initialFiles,
      staticFindings: [],
      patchApproved: false, // NOT APPROVED
      patchProposal: {
        id: 'p-1',
        title: 'Fix i',
        summary: 'fix',
        unifiedDiff: '',
        riskLevel: 'low',
        requiresApproval: true,
        hunks: [
          {
            file: 'src/calc.ts',
            startLine: 2,
            endLine: 2,
            originalCode: '  let i = 1;',
            replacementCode: '  let i = 0;',
            reason: 'fix index',
            riskLevel: 'low',
            potentialSideEffects: 'none',
          },
        ],
      },
    };

    const tempDir = await createIsolatedWorkspace(session.id, session.files);
    await expect(applyPatchToWorkspace(tempDir, session)).rejects.toThrow(
      'Patch cannot be applied without explicit human approval.'
    );

    // Clean up temp
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('applies approved patch cleanly in isolated workspace without touching original data', async () => {
    const session: Session = {
      id: 'test-session-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceType: 'sample_project',
      repoIdentifier: 'test-repo',
      issueDescription: '',
      files: initialFiles,
      staticFindings: [],
      patchApproved: true, // APPROVED
      patchProposal: {
        id: 'p-2',
        title: 'Fix i',
        summary: 'fix',
        unifiedDiff: '',
        riskLevel: 'low',
        requiresApproval: true,
        hunks: [
          {
            file: 'src/calc.ts',
            startLine: 2,
            endLine: 2,
            originalCode: '  let i = 1;',
            replacementCode: '  let i = 0;',
            reason: 'fix index',
            riskLevel: 'low',
            potentialSideEffects: 'none',
          },
        ],
      },
    };

    const tempDir = await createIsolatedWorkspace(session.id, session.files);
    const result = await applyPatchToWorkspace(tempDir, session);

    expect(result.modifiedFiles).toContain('src/calc.ts');

    const patchedContent = fs.readFileSync(path.join(tempDir, 'src/calc.ts'), 'utf-8');
    expect(patchedContent).toContain('let i = 0;');
    expect(patchedContent).not.toContain('let i = 1;');

    // Verify original object in memory was untouched
    expect(initialFiles[0].content).toContain('let i = 1;');

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('validates patch hunk bounds', () => {
    const invalidHunk = {
      file: 'src/calc.ts',
      startLine: 99, // Out of bounds
      endLine: 100,
      originalCode: 'x',
      replacementCode: 'y',
      reason: 'test',
      riskLevel: 'low' as const,
      potentialSideEffects: 'none',
    };

    expect(() => validatePatchHunk(invalidHunk, initialFiles)).toThrow('out of bounds');
  });
});
