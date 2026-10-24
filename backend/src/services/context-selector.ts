import { RepoFile } from '../schemas/session.schema.js';
import { Finding } from '../schemas/diagnosis.schema.js';

export interface SelectedContextFile {
  path: string;
  relevanceScore: number;
  reason: string;
  snippetOrFull: string;
}

export interface ContextSelectionResult {
  selectedFiles: SelectedContextFile[];
  totalChars: number;
  estimatedTokens: number;
  promptContextString: string;
}

const MAX_CONTEXT_CHARS = 32000; // ~8,000 tokens

export function selectModelContext(
  files: RepoFile[],
  issueDescription: string,
  findings: Finding[]
): ContextSelectionResult {
  const queryTerms = (issueDescription || '')
    .toLowerCase()
    .split(/[\s,._\-:;()]+/)
    .filter((w) => w.length > 2);

  const scoredFiles: Array<{
    file: RepoFile;
    score: number;
    reasons: string[];
  }> = [];

  const findingsByFile = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = findingsByFile.get(f.file) || [];
    list.push(f);
    findingsByFile.set(f.file, list);
  }

  for (const file of files) {
    let score = 0;
    const reasons: string[] = [];

    // Prioritize files with static findings
    const fileFindings = findingsByFile.get(file.path);
    if (fileFindings && fileFindings.length > 0) {
      score += 50 * fileFindings.length;
      reasons.push(`${fileFindings.length} static finding(s) detected`);
    }

    // Prioritize test files
    const isTest = /(?:test|spec)\.(?:ts|js|tsx|jsx|py)$/.test(file.path) || file.path.includes('test');
    if (isTest) {
      score += 20;
      reasons.push('Test file relevant for verification');
    }

    // Match query terms in filename
    const lowerPath = file.path.toLowerCase();
    for (const term of queryTerms) {
      if (lowerPath.includes(term)) {
        score += 15;
        reasons.push(`Filename matches keyword "${term}"`);
      }
    }

    // Match query terms in file content
    const lowerContent = file.content.toLowerCase();
    let termHits = 0;
    for (const term of queryTerms) {
      const occurrences = (lowerContent.match(new RegExp(term, 'g')) || []).length;
      if (occurrences > 0) {
        termHits += Math.min(occurrences, 10);
      }
    }
    if (termHits > 0) {
      score += termHits * 3;
      reasons.push(`Contains ${termHits} matches for query terms`);
    }

    if (score === 0) {
      // Base score for source code files
      if (['typescript', 'javascript', 'python'].includes(file.language)) {
        score = 1;
        reasons.push('Primary source code file');
      }
    }

    scoredFiles.push({ file, score, reasons });
  }

  // Sort by highest score first
  scoredFiles.sort((a, b) => b.score - a.score);

  const selectedFiles: SelectedContextFile[] = [];
  let totalChars = 0;
  const promptParts: string[] = [];

  for (const item of scoredFiles) {
    if (item.score <= 0 && selectedFiles.length > 0) continue;

    // Check budget
    const fileHeader = `--- FILE: ${item.file.path} (${item.file.language}) ---\n`;
    const fullContent = item.file.content;
    const estimatedLength = fileHeader.length + fullContent.length + 10;

    if (totalChars + estimatedLength > MAX_CONTEXT_CHARS && selectedFiles.length > 0) {
      // Add a truncated version if we have room
      const remaining = MAX_CONTEXT_CHARS - totalChars - fileHeader.length - 100;
      if (remaining > 500) {
        const truncated = fullContent.substring(0, remaining) + '\n... [TRUNCATED]';
        promptParts.push(`${fileHeader}${truncated}\n`);
        selectedFiles.push({
          path: item.file.path,
          relevanceScore: item.score,
          reason: item.reasons.join(', ') + ' (truncated to fit context)',
          snippetOrFull: truncated,
        });
        totalChars += fileHeader.length + truncated.length;
      }
      break;
    }

    promptParts.push(`${fileHeader}${fullContent}\n`);
    selectedFiles.push({
      path: item.file.path,
      relevanceScore: item.score,
      reason: item.reasons.join(', '),
      snippetOrFull: fullContent,
    });
    totalChars += estimatedLength;
  }

  return {
    selectedFiles,
    totalChars,
    estimatedTokens: Math.ceil(totalChars / 4),
    promptContextString: promptParts.join('\n'),
  };
}
