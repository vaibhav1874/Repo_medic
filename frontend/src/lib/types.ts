export interface Finding {
  id: string;
  file: string;
  line: number;
  severity: 'high' | 'medium' | 'low' | 'info';
  category: 'bug' | 'security' | 'type_error' | 'syntax' | 'performance' | 'code_smell';
  message: string;
  snippet?: string;
}

export interface EvidenceItem {
  id: string;
  file: string;
  startLine: number;
  endLine: number;
  type: 'observed_fact' | 'model_hypothesis' | 'static_analysis_finding';
  snippet: string;
  description: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  explanation: string;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  distinguishingCheck: string;
  confidence: 'High' | 'Medium' | 'Low';
  confidenceRationale: string;
}

export interface DiagnosisResult {
  summary: string;
  symptomIdentified: string;
  findings: Finding[];
  evidence: EvidenceItem[];
  hypotheses: Hypothesis[];
  primaryRootCause: string;
  modelMetadata: {
    provider: string;
    modelId: string;
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
    isLiveInference: boolean;
  };
}

export interface PatchHunk {
  file: string;
  startLine: number;
  endLine: number;
  originalCode: string;
  replacementCode: string;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  potentialSideEffects: string;
}

export interface PatchProposal {
  id: string;
  title: string;
  summary: string;
  hunks: PatchHunk[];
  unifiedDiff: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: true;
  regressionTest?: {
    file: string;
    testCode: string;
    description: string;
  };
}

export interface TestCounts {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
}

export interface TestRunResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  counts: TestCounts;
  available: boolean;
  unavailableReason?: string;
}

export interface VerificationResult {
  executed: boolean;
  baseline?: TestRunResult;
  patched?: TestRunResult;
  outcome: 'SUCCESS' | 'REGRESSION' | 'STILL_FAILING' | 'UNAVAILABLE' | 'ERROR';
  comparisonSummary: string;
  preExistingFailures: number;
  newFailures: number;
  fixedFailures: number;
}

export interface RepoFileSummary {
  path: string;
  size: number;
  language: string;
}

export interface SessionDetail {
  id: string;
  createdAt: string;
  repoIdentifier: string;
  sourceType: 'github_url' | 'zip_upload' | 'sample_project';
  issueDescription: string;
  files: RepoFileSummary[];
  staticFindings: Finding[];
  diagnosis?: DiagnosisResult;
  patchProposal?: PatchProposal;
  patchApproved: boolean;
  verification?: VerificationResult;
  healthMetrics?: {
    totalFiles: number;
    languages: Record<string, number>;
    findingsBySeverity: Record<string, number>;
    hasTests: boolean;
    secretsDetectedCount: number;
  };
}
