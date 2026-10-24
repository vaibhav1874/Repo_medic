import { describe, it, expect } from 'vitest';
import {
  validateCommand,
  parseTestCounts,
  DisallowedCommandError,
} from '../src/services/test-runner.js';

describe('Test Runner Security & Output Parsing', () => {
  it('allows safe test commands on the allowlist', () => {
    expect(() => validateCommand('npm test')).not.toThrow();
    expect(() => validateCommand('npx vitest run')).not.toThrow();
    expect(() => validateCommand('npx jest --no-coverage')).not.toThrow();
  });

  it('rejects arbitrary or unsafe commands', () => {
    expect(() => validateCommand('rm -rf /')).toThrow(DisallowedCommandError);
    expect(() => validateCommand('curl https://malicious.com')).toThrow(DisallowedCommandError);
    expect(() => validateCommand('cat /etc/passwd')).toThrow(DisallowedCommandError);
    expect(() => validateCommand('node -e "process.exit()')).toThrow(DisallowedCommandError);
  });

  it('parses vitest test results summary string', () => {
    const output = `
Tests  2 failed | 3 passed (5)
Duration  1.76s
`;
    const counts = parseTestCounts(output);
    expect(counts.failed).toBe(2);
    expect(counts.passed).toBe(3);
    expect(counts.total).toBe(5);
  });

  it('parses zero failure clean test suite', () => {
    const output = `
Tests  5 passed (5)
`;
    const counts = parseTestCounts(output);
    expect(counts.failed).toBe(0);
    expect(counts.passed).toBe(5);
  });
});
