import { RepoFile } from '../schemas/session.schema.js';
import { Finding } from '../schemas/diagnosis.schema.js';

interface StaticPattern {
  id: string;
  category: 'bug' | 'security' | 'type_error' | 'syntax' | 'performance' | 'code_smell';
  severity: 'high' | 'medium' | 'low' | 'info';
  regex: RegExp;
  message: string;
  applicableLanguages?: string[];
}

const STATIC_PATTERNS: StaticPattern[] = [
  // Off-by-one: loop condition <= length
  {
    id: 'off-by-one-loop-bound',
    category: 'bug',
    severity: 'high',
    regex: /for\s*\([^;]+;\s*[a-zA-Z0-9_]+\s*<=\s*[a-zA-Z0-9_]+\.length\s*;/g,
    message: 'Potential off-by-one error: loop condition uses "<= array.length" instead of "< array.length", which will access an undefined index.',
    applicableLanguages: ['javascript', 'typescript'],
  },
  // Loop starting at index 1 for 0-indexed operations
  {
    id: 'loop-starts-at-one',
    category: 'bug',
    severity: 'medium',
    regex: /for\s*\(\s*(?:let|var)\s+[a-zA-Z0-9_]+\s*=\s*1\s*;\s*[a-zA-Z0-9_]+\s*<\s*[a-zA-Z0-9_]+\.length\s*;/g,
    message: 'Suspicious loop initialization: loop starts at index 1, which may skip the first element (index 0).',
    applicableLanguages: ['javascript', 'typescript'],
  },
  // Division by zero literal
  {
    id: 'division-by-zero-literal',
    category: 'bug',
    severity: 'high',
    regex: /\/\s*0(?![0-9.])/g,
    message: 'Explicit division by zero detected.',
  },
  // Division by variable without prior zero check heuristic
  {
    id: 'unprotected-division',
    category: 'bug',
    severity: 'medium',
    regex: /return\s+([a-zA-Z0-9_]+)\s*\/\s*([a-zA-Z0-9_]+)\s*;/g,
    message: 'Direct division in return statement without explicit zero guard for divisor.',
    applicableLanguages: ['javascript', 'typescript', 'python'],
  },
  // Loose equality with type coercion hazard
  {
    id: 'loose-equality-hazard',
    category: 'code_smell',
    severity: 'low',
    regex: /if\s*\([^!=]+==[^=]/g,
    message: 'Use of loose equality "==" may trigger unexpected JavaScript type coercion. Consider strict equality "===". ',
    applicableLanguages: ['javascript', 'typescript'],
  },
  // Hardcoded secrets (flagged)
  {
    id: 'hardcoded-secret-flag',
    category: 'security',
    severity: 'high',
    regex: /\[REDACTED:(?:AWS_ACCESS_KEY|AWS_SECRET_KEY|GITHUB_TOKEN|PRIVATE_KEY|API_KEY_ASSIGNMENT)\]/g,
    message: 'Redacted sensitive credential detected in source code. Credentials should be stored in environment variables.',
  },
  // Incomplete TODO / FIXME markers in logic
  {
    id: 'incomplete-todo',
    category: 'code_smell',
    severity: 'info',
    regex: /\/\/\s*(?:TODO|FIXME|BUG):?\s*(.+)/gi,
    message: 'Unresolved TODO/FIXME annotation in source code.',
  },
];

export function runStaticAnalysis(files: RepoFile[]): Finding[] {
  const findings: Finding[] = [];
  let findingCount = 0;

  for (const file of files) {
    const lines = file.content.split('\n');

    for (const pattern of STATIC_PATTERNS) {
      if (pattern.applicableLanguages && !pattern.applicableLanguages.includes(file.language)) {
        continue;
      }

      pattern.regex.lastIndex = 0;
      const matches = Array.from(file.content.matchAll(pattern.regex));

      for (const match of matches) {
        if (match.index === undefined) continue;
        const line = file.content.substring(0, match.index).split('\n').length;
        const snippet = lines[line - 1]?.trim() || match[0];

        findingCount++;
        findings.push({
          id: `finding-${findingCount}`,
          file: file.path,
          line,
          severity: pattern.severity,
          category: pattern.category,
          message: pattern.message,
          snippet,
        });
      }
    }
  }

  return findings;
}
