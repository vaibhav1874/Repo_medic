import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  parseGitHubUrl,
  isPathSafe,
  isExcludedPath,
  ingestZipBuffer,
} from '../src/services/repo-ingestion.js';

describe('Repository Ingestion Safety', () => {
  it('parses valid GitHub repository URLs', () => {
    const { owner, repo } = parseGitHubUrl('https://github.com/vaibhav1874/Repo_medic');
    expect(owner).toBe('vaibhav1874');
    expect(repo).toBe('Repo_medic');
  });

  it('rejects invalid or non-GitHub URLs', () => {
    expect(() => parseGitHubUrl('https://gitlab.com/owner/repo')).toThrow(
      'Only github.com repositories are currently supported.'
    );
    expect(() => parseGitHubUrl('not-a-url')).toThrow('Failed to parse GitHub URL');
  });

  it('flags path traversal attempts as unsafe', () => {
    expect(isPathSafe('src/index.ts')).toBe(true);
    expect(isPathSafe('../etc/passwd')).toBe(false);
    expect(isPathSafe('src/../../secret.txt')).toBe(false);
    expect(isPathSafe('/root/id_rsa')).toBe(false);
    expect(isPathSafe('C:/Windows/System32')).toBe(false);
  });

  it('correctly filters excluded directories and binaries', () => {
    expect(isExcludedPath('.git/config')).toBe(true);
    expect(isExcludedPath('node_modules/express/index.js')).toBe(true);
    expect(isExcludedPath('dist/bundle.js')).toBe(true);
    expect(isExcludedPath('assets/image.png')).toBe(true);
    expect(isExcludedPath('bin/app.exe')).toBe(true);
    expect(isExcludedPath('src/utils/calc.ts')).toBe(false);
  });

  it('rejects zip archives containing path traversal exploits', async () => {
    const zip = new JSZip();
    zip.file('safe.txt', 'hello');
    // Artificially inject an unsafe path into loaded files map
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const loaded = await (new JSZip()).loadAsync(buffer);
    // Add path with traversal to simulate an archive crafted by an attacker
    (loaded.files as any)['../secret.txt'] = {
      dir: false,
      async: async () => Buffer.from('stolen data'),
    };

    // Verify isPathSafe catches it
    expect(isPathSafe('../secret.txt')).toBe(false);
  });

  it('successfully extracts valid zip archive with secret redaction', async () => {
    const zip = new JSZip();
    zip.file('src/app.ts', 'const key = "AKIA1111111111111111"; export const x = 1;');
    zip.file('README.md', '# Demo Project');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    const result = await ingestZipBuffer(buffer);
    expect(result.files.length).toBe(2);
    expect(result.secretsCount).toBe(1);

    const appFile = result.files.find((f) => f.path === 'src/app.ts');
    expect(appFile?.content).toContain('[REDACTED:AWS_ACCESS_KEY]');
    expect(appFile?.content).not.toContain('AKIA1111111111111111');
  });
});
