import { z } from 'zod';

export const EvidenceItemSchema = z.object({
  id: z.string(),
  file: z.string(),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  type: z.enum(['observed_fact', 'model_hypothesis', 'static_analysis_finding']),
  snippet: z.string(),
  description: z.string(),
});

export const HypothesisSchema = z.object({
  id: z.string(),
  title: z.string(),
  explanation: z.string(),
  supportingEvidenceIds: z.array(z.string()),
  contradictingEvidenceIds: z.array(z.string()),
  distinguishingCheck: z.string(),
  confidence: z.enum(['High', 'Medium', 'Low']),
  confidenceRationale: z.string(),
});

export const FindingSchema = z.object({
  id: z.string(),
  file: z.string(),
  line: z.number().int().positive(),
  severity: z.enum(['high', 'medium', 'low', 'info']),
  category: z.enum(['bug', 'security', 'type_error', 'syntax', 'performance', 'code_smell']),
  message: z.string(),
  snippet: z.string().optional(),
});

export const DiagnosisResultSchema = z.object({
  summary: z.string(),
  symptomIdentified: z.string(),
  findings: z.array(FindingSchema),
  evidence: z.array(EvidenceItemSchema),
  hypotheses: z.array(HypothesisSchema),
  primaryRootCause: z.string(),
  modelMetadata: z.object({
    provider: z.string(),
    modelId: z.string(),
    latencyMs: z.number(),
    promptTokens: z.number().optional(),
    completionTokens: z.number().optional(),
    isLiveInference: z.boolean(),
  }),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type DiagnosisResult = z.infer<typeof DiagnosisResultSchema>;
