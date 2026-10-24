import { describe, it, expect } from 'vitest';
import { DiagnosisResultSchema } from '../src/schemas/diagnosis.schema.js';
import { PatchProposalSchema } from '../src/schemas/patch.schema.js';
import { getSampleDiagnosis, getSamplePatchProposal } from '../src/services/model-provider.js';

describe('Model Provider & Schema Validation', () => {
  it('validates a complete DiagnosisResult', () => {
    const sample = getSampleDiagnosis();
    const result = DiagnosisResultSchema.safeParse(sample);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.findings.length).toBeGreaterThan(0);
      expect(result.data.evidence.length).toBeGreaterThan(0);
      expect(result.data.hypotheses.length).toBeGreaterThan(0);
      expect(result.data.modelMetadata.provider).toContain('Nebius');
    }
  });

  it('rejects malformed diagnosis missing required fields', () => {
    const malformed = {
      summary: 'Missing everything else',
    };
    const result = DiagnosisResultSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it('validates a complete PatchProposal', () => {
    const sample = getSamplePatchProposal('src/calculator.ts');
    const result = PatchProposalSchema.safeParse(sample);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hunks.length).toBeGreaterThan(0);
      expect(result.data.requiresApproval).toBe(true);
      expect(result.data.regressionTest).toBeDefined();
    }
  });

  it('rejects patch proposal missing requiresApproval=true', () => {
    const invalid = {
      id: 'p-1',
      title: 'Fix',
      summary: 'desc',
      hunks: [],
      unifiedDiff: '',
      riskLevel: 'low',
      requiresApproval: false, // Must be literal true!
    };
    const result = PatchProposalSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
