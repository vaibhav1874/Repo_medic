import { config } from '../config.js';
import { DiagnosisResult, DiagnosisResultSchema } from '../schemas/diagnosis.schema.js';
import { PatchProposal, PatchProposalSchema } from '../schemas/patch.schema.js';

export class ModelProviderError extends Error {
  constructor(message: string, public code: 'RATE_LIMIT' | 'AUTH_ERROR' | 'INVALID_RESPONSE' | 'TIMEOUT' | 'UNAVAILABLE') {
    super(message);
    this.name = 'ModelProviderError';
  }
}

export interface ModelCallMetadata {
  provider: string;
  modelId: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  isLiveInference: boolean;
}

/**
 * Executes a call to the Nebius Token Factory OpenAI-compatible API
 */
async function callNebiusApi(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature = 0.2
): Promise<{ rawText: string; metadata: ModelCallMetadata }> {
  if (!config.nebius.apiKey) {
    throw new ModelProviderError(
      'NEBIUS_API_KEY environment variable is not configured. Set it in .env or run in demo mode.',
      'AUTH_ERROR'
    );
  }

  const endpoint = `${config.nebius.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.limits.analysisTimeoutMs);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.nebius.apiKey}`,
      },
      body: JSON.stringify({
        model: config.nebius.modelId,
        messages,
        temperature,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ModelProviderError(`Inference request timed out after ${config.limits.analysisTimeoutMs}ms`, 'TIMEOUT');
    }
    throw new ModelProviderError(`Failed to reach Nebius inference API: ${err.message}`, 'UNAVAILABLE');
  } finally {
    clearTimeout(timeoutId);
  }

  const latencyMs = Date.now() - startTime;

  if (response.status === 429) {
    throw new ModelProviderError('Nebius API rate limit reached. Please retry shortly.', 'RATE_LIMIT');
  }

  if (response.status === 401 || response.status === 403) {
    throw new ModelProviderError('Authentication failed: Invalid or missing Nebius API key.', 'AUTH_ERROR');
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new ModelProviderError(
      `Nebius API returned status ${response.status}: ${errorBody || response.statusText}`,
      'UNAVAILABLE'
    );
  }

  const data = (await response.json()) as any;
  const choice = data.choices?.[0];
  if (!choice || !choice.message?.content) {
    throw new ModelProviderError('Empty response received from inference provider.', 'INVALID_RESPONSE');
  }

  return {
    rawText: choice.message.content,
    metadata: {
      provider: 'Nebius Token Factory',
      modelId: config.nebius.modelId,
      latencyMs,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      isLiveInference: true,
    },
  };
}

/**
 * Retry helper with exponential backoff
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  let delay = 1000;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (err instanceof ModelProviderError && err.code === 'RATE_LIMIT' && attempt <= maxRetries) {
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }

  throw new Error('Exhausted inference retries.');
}

/**
 * Generate Structured Diagnosis using Nebius + NVIDIA model
 */
export async function generateDiagnosis(
  issueDescription: string,
  contextString: string,
  staticFindingsSummary: string
): Promise<DiagnosisResult> {
  // If demo mode or key missing, provide deterministic demo output
  if (config.demoMode || !config.nebius.apiKey) {
    return getSampleDiagnosis();
  }

  const systemPrompt = `You are RepoMedic AI, an evidence-driven code diagnosis and repair agent powered by NVIDIA open models.
Your task is to analyze the repository files, inspect the reported bug symptom, and output a structured JSON diagnosis.

CRITICAL RULES:
1. Every evidence item MUST cite an actual file and exact 1-indexed line range from the provided context.
2. Clearly distinguish observed facts from hypotheses and static findings.
3. If the bug has multiple possible explanations, provide up to 3 competing hypotheses. If evidence points to a single clear cause, provide 1 hypothesis.
4. Do NOT present confidence as a mathematical probability. Use 'High', 'Medium', or 'Low' and explain the reasoning in plain English.
5. Output STRICT JSON matching this schema:
{
  "summary": "Concise summary of findings",
  "symptomIdentified": "Description of the symptom observed",
  "findings": [
    {
      "id": "f-1",
      "file": "path/to/file.ts",
      "line": 10,
      "severity": "high|medium|low|info",
      "category": "bug|security|type_error|syntax|performance|code_smell",
      "message": "Specific issue description",
      "snippet": "code snippet"
    }
  ],
  "evidence": [
    {
      "id": "e-1",
      "file": "path/to/file.ts",
      "startLine": 12,
      "endLine": 15,
      "type": "observed_fact|model_hypothesis|static_analysis_finding",
      "snippet": "exact snippet",
      "description": "why this is evidence"
    }
  ],
  "hypotheses": [
    {
      "id": "h-1",
      "title": "Hypothesis title",
      "explanation": "Detailed explanation",
      "supportingEvidenceIds": ["e-1"],
      "contradictingEvidenceIds": [],
      "distinguishingCheck": "Test or inspection that proves or refutes this",
      "confidence": "High|Medium|Low",
      "confidenceRationale": "Plain English rationale"
    }
  ],
  "primaryRootCause": "Direct statement of the root cause"
}`;

  const userPrompt = `USER REPORTED BUG / SYMPTOM:
${issueDescription || 'No description provided. Perform comprehensive bug and sanity inspection.'}

STATIC ANALYSIS FINDINGS:
${staticFindingsSummary}

RELEVANT SOURCE FILES:
${contextString}

Analyze the code and produce the diagnosis JSON.`;

  const { rawText, metadata } = await callWithRetry(() =>
    callNebiusApi([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])
  );

  try {
    const parsed = JSON.parse(rawText);
    const validated = DiagnosisResultSchema.parse({
      ...parsed,
      modelMetadata: metadata,
    });
    return validated;
  } catch (err: any) {
    throw new ModelProviderError(
      `Model returned output that failed schema validation: ${err.message}`,
      'INVALID_RESPONSE'
    );
  }
}

/**
 * Generate Minimal Patch Proposal using Nebius + NVIDIA model
 */
export async function generatePatchProposal(
  issueDescription: string,
  diagnosis: DiagnosisResult,
  targetFileContent: string,
  targetFilePath: string
): Promise<PatchProposal> {
  if (config.demoMode || !config.nebius.apiKey) {
    return getSamplePatchProposal(targetFilePath);
  }

  const systemPrompt = `You are RepoMedic AI, a minimal, reviewable code repair agent.
Generate a minimal, surgical fix for the diagnosed root cause.

CRITICAL RULES:
1. Propose MINIMAL changes only. Do not rewrite unrelated code or reformat spacing unnecessarily.
2. For each hunk, specify exact startLine and endLine (1-indexed) in the target file, original code, replacement code, the reason, risk level ('low'|'medium'|'high'), and potential side effects.
3. Suggest a regression test that specifically catches this bug.
4. Output STRICT JSON matching this schema:
{
  "id": "patch-1",
  "title": "Fix description",
  "summary": "What the patch does",
  "hunks": [
    {
      "file": "${targetFilePath}",
      "startLine": 10,
      "endLine": 12,
      "originalCode": "...",
      "replacementCode": "...",
      "reason": "why this is necessary",
      "riskLevel": "low|medium|high",
      "potentialSideEffects": "none or description"
    }
  ],
  "unifiedDiff": "--- a/...\n+++ b/...",
  "riskLevel": "low|medium|high",
  "requiresApproval": true,
  "regressionTest": {
    "file": "tests/regression.test.ts",
    "testCode": "...",
    "description": "Checks the fixed behavior"
  }
}`;

  const userPrompt = `ROOT CAUSE:
${diagnosis.primaryRootCause}

SYMPTOM:
${diagnosis.symptomIdentified}

TARGET FILE (${targetFilePath}):
${targetFileContent}

Produce the patch proposal JSON.`;

  const { rawText } = await callWithRetry(() =>
    callNebiusApi([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])
  );

  try {
    const parsed = JSON.parse(rawText);
    const validated = PatchProposalSchema.parse(parsed);
    return validated;
  } catch (err: any) {
    throw new ModelProviderError(
      `Model patch output failed schema validation: ${err.message}`,
      'INVALID_RESPONSE'
    );
  }
}

/**
 * Deterministic Sample Diagnosis for Demo / Testing
 */
export function getSampleDiagnosis(): DiagnosisResult {
  return {
    summary: 'Detected 3 concrete issues in the calculator module: an off-by-one loop index in sum(), an unhandled division by zero in divide(), and string-number concatenation coercion in add().',
    symptomIdentified: 'Incorrect total calculation on arrays, runtime crash on division by zero, and unexpected string concatenation.',
    findings: [
      {
        id: 'f-1',
        file: 'src/calculator.ts',
        line: 14,
        severity: 'high',
        category: 'bug',
        message: 'Loop in sum() starts at index 1 instead of 0, skipping the first element in the array.',
        snippet: 'for (let i = 1; i < numbers.length; i++) {',
      },
      {
        id: 'f-2',
        file: 'src/calculator.ts',
        line: 25,
        severity: 'high',
        category: 'bug',
        message: 'divide() performs direct division without checking if the divisor is zero.',
        snippet: 'return a / b;',
      },
      {
        id: 'f-3',
        file: 'src/calculator.ts',
        line: 6,
        severity: 'medium',
        category: 'type_error',
        message: 'add() uses binary + operator without casting string parameters, resulting in string concatenation instead of numeric addition.',
        snippet: 'return (a as any) + (b as any);',
      },
    ],
    evidence: [
      {
        id: 'e-1',
        file: 'src/calculator.ts',
        startLine: 13,
        endLine: 17,
        type: 'observed_fact',
        snippet: 'export function sum(numbers: number[]): number {\n  let total = 0;\n  for (let i = 1; i < numbers.length; i++) {\n    total += numbers[i];\n  }\n  return total;\n}',
        description: 'Loop variable i is initialized to 1 instead of 0, so numbers[0] is never added to total.',
      },
      {
        id: 'e-2',
        file: 'src/calculator.ts',
        startLine: 24,
        endLine: 26,
        type: 'observed_fact',
        snippet: 'export function divide(a: number, b: number): number {\n  return a / b;\n}',
        description: 'No zero-division guard exists; division by zero yields Infinity or unexpected runtime behavior.',
      },
    ],
    hypotheses: [
      {
        id: 'h-1',
        title: 'Off-By-One Initialization Bug in sum()',
        explanation: 'The loop index counter i was mistakenly set to 1 instead of 0 during refactoring, causing the initial array element to be ignored in all sum calculations.',
        supportingEvidenceIds: ['e-1'],
        contradictingEvidenceIds: [],
        distinguishingCheck: 'Run test sum([10, 20, 30]): expected 60, current implementation returns 50.',
        confidence: 'High',
        confidenceRationale: 'The source code explicitly assigns i = 1 in the loop initialization on line 14.',
      },
      {
        id: 'h-2',
        title: 'Missing Boundary Validation in divide()',
        explanation: 'The divide function lacks defense-in-depth parameter validation for zero divisor.',
        supportingEvidenceIds: ['e-2'],
        contradictingEvidenceIds: [],
        distinguishingCheck: 'Call divide(10, 0) and verify whether an Error is thrown or Infinity is returned.',
        confidence: 'High',
        confidenceRationale: 'Direct inspection of line 25 shows unconditional return a / b.',
      },
    ],
    primaryRootCause: 'src/calculator.ts contains an off-by-one loop initialization in sum() and missing divisor validation in divide().',
    modelMetadata: {
      provider: 'Nebius Token Factory (Demo Mode)',
      modelId: 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
      latencyMs: 145,
      promptTokens: 420,
      completionTokens: 385,
      isLiveInference: false,
    },
  };
}

/**
 * Deterministic Sample Patch Proposal for Demo / Testing
 */
export function getSamplePatchProposal(targetFilePath: string = 'src/calculator.ts'): PatchProposal {
  return {
    id: 'patch-sample-1',
    title: 'Fix loop indexing in sum() and add zero check in divide()',
    summary: 'Initializes loop counter to 0 in sum() and throws Error when divisor is zero in divide().',
    hunks: [
      {
        file: targetFilePath,
        startLine: 14,
        endLine: 14,
        originalCode: '  for (let i = 1; i < numbers.length; i++) {',
        replacementCode: '  for (let i = 0; i < numbers.length; i++) {',
        reason: 'Start iteration at index 0 so the first element is included in the sum calculation.',
        riskLevel: 'low',
        potentialSideEffects: 'None; restores intended mathematical summation behavior.',
      },
      {
        file: targetFilePath,
        startLine: 24,
        endLine: 26,
        originalCode: 'export function divide(a: number, b: number): number {\n  return a / b;\n}',
        replacementCode: 'export function divide(a: number, b: number): number {\n  if (b === 0) {\n    throw new Error("Division by zero is not allowed");\n  }\n  return a / b;\n}',
        reason: 'Validate that divisor b !== 0 to prevent unhandled zero division.',
        riskLevel: 'low',
        potentialSideEffects: 'Callers passing 0 will receive an explicit Error instead of Infinity.',
      },
    ],
    unifiedDiff: `--- a/${targetFilePath}
+++ b/${targetFilePath}
@@ -14,1 +14,1 @@
-  for (let i = 1; i < numbers.length; i++) {
+  for (let i = 0; i < numbers.length; i++) {
@@ -24,3 +24,6 @@
 export function divide(a: number, b: number): number {
+  if (b === 0) {
+    throw new Error("Division by zero is not allowed");
+  }
   return a / b;
 }`,
    riskLevel: 'low',
    requiresApproval: true,
    regressionTest: {
      file: 'tests/calculator.test.ts',
      testCode: `test('sum includes the first element', () => {
  expect(sum([10, 20, 30])).toBe(60);
});

test('divide throws on zero divisor', () => {
  expect(() => divide(10, 0)).toThrow('Division by zero is not allowed');
});`,
      description: 'Verifies that sum([10, 20, 30]) equals 60 and divide(10, 0) throws an explicit Error.',
    },
  };
}
