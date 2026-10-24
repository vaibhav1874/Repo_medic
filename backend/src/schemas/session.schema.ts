import { z } from 'zod';
import { DiagnosisResultSchema, FindingSchema } from './diagnosis.schema.js';
import { PatchProposalSchema } from './patch.schema.js';

export const RepoFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  size: z.number(),
  language: z.string(),
  isRedacted: z.boolean().default(false),
});

export const TestCountsSchema = z.object({
  total: z.number().default(0),
  passed: z.number().default(0),
  failed: z.number().default(0),
  skipped: z.number().default(0),
  errors: z.number().default(0),
});

export const TestRunResultSchema = z.object({
  command: z.string(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  durationMs: z.number(),
  counts: TestCountsSchema,
  available: z.boolean(),
  unavailableReason: z.string().optional(),
});

export const VerificationResultSchema = z.object({
  executed: z.boolean(),
  baseline: TestRunResultSchema.optional(),
  patched: TestRunResultSchema.optional(),
  outcome: z.enum(['SUCCESS', 'REGRESSION', 'STILL_FAILING', 'UNAVAILABLE', 'ERROR']),
  comparisonSummary: z.string(),
  preExistingFailures: z.number().default(0),
  newFailures: z.number().default(0),
  fixedFailures: z.number().default(0),
});

export const SessionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceType: z.enum(['github_url', 'zip_upload', 'sample_project']),
  repoIdentifier: z.string(),
  issueDescription: z.string().default(''),
  files: z.array(RepoFileSchema),
  staticFindings: z.array(FindingSchema).default([]),
  diagnosis: DiagnosisResultSchema.optional(),
  patchProposal: PatchProposalSchema.optional(),
  patchApproved: z.boolean().default(false),
  approvedAt: z.string().optional(),
  verification: VerificationResultSchema.optional(),
  healthMetrics: z.object({
    totalFiles: z.number(),
    languages: z.record(z.number()),
    findingsBySeverity: z.record(z.number()),
    hasTests: z.boolean(),
    secretsDetectedCount: z.number(),
  }).optional(),
});

export type RepoFile = z.infer<typeof RepoFileSchema>;
export type TestRunResult = z.infer<typeof TestRunResultSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
export type Session = z.infer<typeof SessionSchema>;
