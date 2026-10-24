import JSZip from 'jszip';
import path from 'path';
import { RepoFile } from '../schemas/session.schema.js';
import { redactSecrets } from './secret-redactor.js';
import { config } from '../config.js';

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '__pycache__',
  '.venv',
  'venv',
  'env',
  '.idea',
  '.vscode',
  'coverage',
]);

const EXCLUDED_EXTENSIONS = new Set([
  '.exe', '.bin', '.dll', '.so', '.dylib', '.iso', '.tar', '.gz', '.zip',
  '.7z', '.rar', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4',
  '.mov', '.mp3', '.wav', '.pdf', '.woff', '.woff2', '.ttf', '.eot',
  '.pyc', '.pyd', '.class', '.o', '.obj',
]);

export interface IngestionOptions {
  sourceType: 'github_url' | 'zip_upload' | 'sample_project';
  target: string | Buffer;
  issueDescription?: string;
}

export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts':
    case '.tsx':
      return 'typescript';
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return 'javascript';
    case '.py':
      return 'python';
    case '.json':
      return 'json';
    case '.md':
      return 'markdown';
    case '.html':
      return 'html';
    case '.css':
      return 'css';
    case '.yaml':
    case '.yml':
      return 'yaml';
    case '.sh':
    case '.bash':
      return 'shell';
    case '.go':
      return 'go';
    case '.rs':
      return 'rust';
    default:
      return 'plaintext';
  }
}

export function isPathSafe(filePath: string): boolean {
  const normalized = path.normalize(filePath).replace(/\\/g, '/');
  if (normalized.startsWith('../') || normalized.includes('/../') || normalized.startsWith('/')) {
    return false;
  }
  // Disallow absolute drive letters on Windows like C:
  if (/^[a-zA-Z]:/.test(normalized)) {
    return false;
  }
  return true;
}

export function isExcludedPath(filePath: string): boolean {
  const parts = filePath.replace(/\\/g, '/').split('/');
  for (const part of parts) {
    if (EXCLUDED_DIRS.has(part)) {
      return true;
    }
  }
  const ext = path.extname(filePath).toLowerCase();
  if (EXCLUDED_EXTENSIONS.has(ext)) {
    return true;
  }
  return false;
}

/**
 * Ingests repository files from a ZIP buffer
 */
export async function ingestZipBuffer(buffer: Buffer): Promise<{ files: RepoFile[]; secretsCount: number }> {
  const zip = new JSZip();
  const loaded = await zip.loadAsync(buffer);
  const files: RepoFile[] = [];
  let totalSize = 0;
  let secretsCount = 0;

  const entries = Object.keys(loaded.files);
  if (entries.length > config.limits.maxRepoFiles) {
    throw new Error(`Repository exceeds maximum file count limit (${config.limits.maxRepoFiles} files).`);
  }

  for (const relativePath of entries) {
    const entry = loaded.files[relativePath];
    if (entry.dir) continue;

    if (!isPathSafe(relativePath)) {
      throw new Error(`Unsafe path detected in archive: ${relativePath}`);
    }

    if (isExcludedPath(relativePath)) {
      continue;
    }

    const contentBuffer = await entry.async('nodebuffer');
    const size = contentBuffer.length;

    if (size > config.limits.maxFileSizeMb * 1024 * 1024) {
      continue; // Skip oversized single file
    }

    totalSize += size;
    if (totalSize > config.limits.maxRepoSizeMb * 1024 * 1024) {
      throw new Error(`Total repository size exceeds ${config.limits.maxRepoSizeMb} MB limit.`);
    }

    // Check for null bytes (binary file heuristic)
    const isBinary = contentBuffer.slice(0, 512).includes(0);
    if (isBinary) continue;

    const rawContent = contentBuffer.toString('utf-8');
    const { redactedText, foundSecrets } = redactSecrets(rawContent);
    secretsCount += foundSecrets.length;

    files.push({
      path: relativePath.replace(/\\/g, '/'),
      content: redactedText,
      size,
      language: detectLanguage(relativePath),
      isRedacted: foundSecrets.length > 0,
    });
  }

  return { files, secretsCount };
}

/**
 * Parses GitHub repo URL to owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  try {
    const cleaned = url.trim().replace(/\.git$/, '');
    const urlObj = new URL(cleaned);
    if (urlObj.hostname !== 'github.com') {
      throw new Error('Only github.com repositories are currently supported.');
    }
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
      throw new Error('Invalid GitHub repository URL. Expected format: https://github.com/owner/repo');
    }
    return { owner: parts[0], repo: parts[1] };
  } catch (err: any) {
    throw new Error(`Failed to parse GitHub URL: ${err.message}`);
  }
}

/**
 * Ingests repository files from public GitHub API
 */
export async function ingestGitHubUrl(url: string): Promise<{ files: RepoFile[]; secretsCount: number }> {
  const { owner, repo } = parseGitHubUrl(url);

  // Fetch repository default branch info or tree
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
  const headers: Record<string, string> = {
    'User-Agent': 'RepoMedic-AI-Agent',
    'Accept': 'application/vnd.github.v3+json',
  };

  let response = await fetch(apiUrl, { headers });
  if (response.status === 404) {
    // Try master branch
    const masterUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
    response = await fetch(masterUrl, { headers });
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`GitHub repository ${owner}/${repo} not found or is empty.`);
    }
    if (response.status === 403) {
      throw new Error('GitHub API rate limit reached. Please try uploading a ZIP archive instead.');
    }
    throw new Error(`GitHub API returned status ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as { tree: Array<{ path: string; type: string; size?: number; url: string }> };
  if (!data.tree || !Array.isArray(data.tree)) {
    throw new Error('Invalid tree response from GitHub API.');
  }

  const files: RepoFile[] = [];
  let totalSize = 0;
  let secretsCount = 0;

  const validEntries = data.tree.filter(
    (item) => item.type === 'blob' && isPathSafe(item.path) && !isExcludedPath(item.path)
  );

  if (validEntries.length > config.limits.maxRepoFiles) {
    throw new Error(`Repository exceeds maximum file count limit (${config.limits.maxRepoFiles} files).`);
  }

  // Fetch files in batches of 10 to avoid hammering GitHub
  const batchSize = 10;
  for (let i = 0; i < validEntries.length; i += batchSize) {
    const batch = validEntries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (entry) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${entry.path}`;
          let fileRes = await fetch(rawUrl);
          if (!fileRes.ok) {
            const masterRawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${entry.path}`;
            fileRes = await fetch(masterRawUrl);
          }
          if (!fileRes.ok) return;

          const rawContent = await fileRes.text();
          const size = Buffer.byteLength(rawContent, 'utf-8');

          if (size > config.limits.maxFileSizeMb * 1024 * 1024) return;
          totalSize += size;
          if (totalSize > config.limits.maxRepoSizeMb * 1024 * 1024) return;

          const { redactedText, foundSecrets } = redactSecrets(rawContent);
          secretsCount += foundSecrets.length;

          files.push({
            path: entry.path,
            content: redactedText,
            size,
            language: detectLanguage(entry.path),
            isRedacted: foundSecrets.length > 0,
          });
        } catch {
          // Ignore individual fetch failure
        }
      })
    );
  }

  return { files, secretsCount };
}
