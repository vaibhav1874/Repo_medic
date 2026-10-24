import { describe, it, expect } from 'vitest';
import { redactSecrets } from '../src/services/secret-redactor.js';

describe('Secret Redactor Service', () => {
  it('detects and redacts AWS access keys', () => {
    const input = 'const accessKey = "AKIAIOSFODNN7EXAMPLE";';
    const result = redactSecrets(input);

    expect(result.redactedText).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(result.redactedText).toContain('[REDACTED:AWS_ACCESS_KEY]');
    expect(result.foundSecrets.length).toBe(1);
    expect(result.foundSecrets[0].type).toBe('AWS_ACCESS_KEY');
  });

  it('detects and redacts GitHub personal access tokens', () => {
    const input = 'const token = "ghp_123456789012345678901234567890123456";';
    const result = redactSecrets(input);

    expect(result.redactedText).not.toContain('ghp_123456789012345678901234567890123456');
    expect(result.redactedText).toContain('[REDACTED:GITHUB_TOKEN]');
    expect(result.foundSecrets.length).toBe(1);
  });

  it('detects and redacts private key blocks', () => {
    const input = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y1W...fake...
-----END RSA PRIVATE KEY-----`;
    const result = redactSecrets(input);

    expect(result.redactedText).not.toContain('MIIEowIBAAKCAQEA0Y1W');
    expect(result.redactedText).toContain('[REDACTED:PRIVATE_KEY]');
  });

  it('detects password and api key assignments', () => {
    const input = 'const password = "SuperSecretPassword123!";\nconst apiKey = "abcdef1234567890xyz";';
    const result = redactSecrets(input);

    expect(result.redactedText).not.toContain('SuperSecretPassword123!');
    expect(result.redactedText).not.toContain('abcdef1234567890xyz');
    expect(result.redactedText).toContain('[REDACTED:PASSWORD_ASSIGNMENT]');
    expect(result.redactedText).toContain('[REDACTED:API_KEY_ASSIGNMENT]');
  });

  it('leaves clean source code unchanged', () => {
    const cleanCode = 'export function add(a: number, b: number) { return a + b; }';
    const result = redactSecrets(cleanCode);

    expect(result.redactedText).toBe(cleanCode);
    expect(result.foundSecrets.length).toBe(0);
  });
});
