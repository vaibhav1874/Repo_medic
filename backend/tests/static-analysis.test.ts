import { describe, it, expect } from 'vitest';
import { runStaticAnalysis } from '../src/services/static-analysis.js';
import { RepoFile } from '../schemas/session.schema.js';

describe('Deterministic Static Analysis', () => {
  it('detects off-by-one loop indexing', () => {
    const files: RepoFile[] = [
      {
        path: 'src/calc.ts',
        language: 'typescript',
        size: 100,
        content: `export function sum(arr: number[]) {\n  let total = 0;\n  for (let i = 1; i < arr.length; i++) {\n    total += arr[i];\n  }\n  return total;\n}`,
      },
    ];

    const findings = runStaticAnalysis(files);
    expect(findings.length).toBeGreaterThanOrEqual(1);

    const offByOne = findings.find((f) => f.category === 'bug' && f.line === 3);
    expect(offByOne).toBeDefined();
    expect(offByOne?.message).toContain('loop starts at index 1');
  });

  it('detects division by zero literal', () => {
    const files: RepoFile[] = [
      {
        path: 'src/math.ts',
        language: 'typescript',
        size: 50,
        content: `const ratio = 100 / 0;`,
      },
    ];

    const findings = runStaticAnalysis(files);
    expect(findings.some((f) => f.message.includes('division by zero'))).toBe(true);
  });

  it('returns empty findings on clean code', () => {
    const files: RepoFile[] = [
      {
        path: 'src/clean.ts',
        language: 'typescript',
        size: 60,
        content: `export function multiply(a: number, b: number): number {\n  return a * b;\n}`,
      },
    ];

    const findings = runStaticAnalysis(files);
    expect(findings.length).toBe(0);
  });
});
