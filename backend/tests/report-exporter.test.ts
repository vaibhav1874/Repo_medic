import { describe, it, expect } from 'vitest';
import { exportSessionMarkdown, exportSessionJson } from '../src/services/report-exporter.js';
import { Session } from '../schemas/session.schema.js';
import { getSampleDiagnosis, getSamplePatchProposal } from '../src/services/model-provider.js';

describe('Report Exporter', () => {
  const session: Session = {
    id: 'test-session-uuid-1234',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceType: 'sample_project',
    repoIdentifier: 'repo-medic/sample-calculator',
    issueDescription: 'Sum function ignores first item',
    files: [],
    staticFindings: [
      {
        id: 'f-1',
        file: 'src/calculator.ts',
        line: 14,
        severity: 'high',
        category: 'bug',
        message: 'Loop starts at index 1',
      },
    ],
    diagnosis: getSampleDiagnosis(),
    patchProposal: getSamplePatchProposal(),
    patchApproved: true,
    approvedAt: new Date().toISOString(),
    verification: {
      executed: true,
      outcome: 'SUCCESS',
      comparisonSummary: 'All pre-existing failures resolved.',
      preExistingFailures: 2,
      newFailures: 0,
      fixedFailures: 2,
      baseline: {
        command: 'npx vitest run',
        exitCode: 1,
        stdout: 'Tests  2 failed | 3 passed (5)',
        stderr: '',
        durationMs: 1500,
        counts: { total: 5, passed: 3, failed: 2, skipped: 0, errors: 0 },
        available: true,
      },
      patched: {
        command: 'npx vitest run',
        exitCode: 0,
        stdout: 'Tests  5 passed (5)',
        stderr: '',
        durationMs: 1400,
        counts: { total: 5, passed: 5, failed: 0, skipped: 0, errors: 0 },
        available: true,
      },
    },
  };

  it('generates Markdown report with all required sections', () => {
    const md = exportSessionMarkdown(session);

    expect(md).toContain('RepoMedic AI — Engineering & Audit Report');
    expect(md).toContain('test-session-uuid-1234');
    expect(md).toContain('repo-medic/sample-calculator');
    expect(md).toContain('APPROVED BY HUMAN');
    expect(md).toContain('Evidence Graph & Root-Cause Hypotheses');
    expect(md).toContain('Deterministic Verification & Test Results');
    expect(md).toContain('SUCCESS');
    expect(md).toContain('**Pre-existing Failures:** 2');
    expect(md).toContain('**Fixed Failures:** 2');
  });

  it('generates valid JSON export', () => {
    const jsonStr = exportSessionJson(session);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.id).toBe(session.id);
    expect(parsed.repoIdentifier).toBe(session.repoIdentifier);
    expect(parsed.patchApproved).toBe(true);
    expect(parsed.verification.outcome).toBe('SUCCESS');
  });
});
