import { z } from 'zod';

export const PatchHunkSchema = z.object({
  file: z.string(),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  originalCode: z.string(),
  replacementCode: z.string(),
  reason: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  potentialSideEffects: z.string(),
});

export const PatchProposalSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  hunks: z.array(PatchHunkSchema),
  unifiedDiff: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  requiresApproval: z.literal(true),
  regressionTest: z.object({
    file: z.string(),
    testCode: z.string(),
    description: z.string(),
  }).optional(),
});

export type PatchHunk = z.infer<typeof PatchHunkSchema>;
export type PatchProposal = z.infer<typeof PatchProposalSchema>;
