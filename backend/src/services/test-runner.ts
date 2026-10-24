import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { TestRunResult } from '../schemas/session.schema.js';
import { config } from '../config.js';

export class DisallowedCommandError extends Error {
  constructor(command: string) {
    super(`Command "${command}" is not on the execution allowlist. Allowed commands: ${config.allowedCommands.join(', ')}`);
    this.name = 'DisallowedCommandError';
  }
}

/**
 * Validates that command is strictly on the allowlist
 */
export function validateCommand(command: string): void {
  const normalized = command.trim();
  const isAllowed = config.allowedCommands.some(
    (allowed) => normalized === allowed || normalized.startsWith(`${allowed} `)
  );

  if (!isAllowed) {
    throw new DisallowedCommandError(command);
  }
}

/**
 * Parses test output counts from vitest, jest, or generic test outputs
 */
export function parseTestCounts(output: string): {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
} {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let errors = 0;

  // Match passed: e.g. "3 passed", "5 passed (5)", "passed: 3"
  const passMatch = output.match(/(\d+)\s+passed/i);
  if (passMatch) {
    passed = parseInt(passMatch[1], 10);
  }

  // Match failed: e.g. "2 failed", "failed: 2", "1 error"
  const failMatch = output.match(/(\d+)\s+failed/i);
  if (failMatch) {
    failed = parseInt(failMatch[1], 10);
  }

  // Match skipped
  const skipMatch = output.match(/(\d+)\s+skipped/i);
  if (skipMatch) {
    skipped = parseInt(skipMatch[1], 10);
  }

  const total = passed + failed + skipped + errors;

  return { total, passed, failed, skipped, errors };
}

/**
 * Detects appropriate test command based on package.json in workspace
 */
export function detectTestCommand(workspaceDir: string): string | null {
  const pkgPath = path.join(workspaceDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg.scripts && pkg.scripts.test) {
      // If scripts.test contains vitest, run npx vitest run
      if (pkg.scripts.test.includes('vitest') || pkg.devDependencies?.vitest) {
        return 'npx vitest run';
      }
      return 'npm test';
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Executes a test command inside the isolated workspace with strict limits
 */
export async function runIsolatedTests(
  workspaceDir: string,
  preferredCommand?: string
): Promise<TestRunResult> {
  const command = preferredCommand || detectTestCommand(workspaceDir) || 'npx vitest run';

  try {
    validateCommand(command);
  } catch (err: any) {
    return {
      command,
      exitCode: 1,
      stdout: '',
      stderr: err.message,
      durationMs: 0,
      counts: { total: 0, passed: 0, failed: 0, skipped: 0, errors: 1 },
      available: false,
      unavailableReason: err.message,
    };
  }

  const startTime = Date.now();
  const [cmd, ...args] = command.split(' ');

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Use shell for windows execution
    const child = spawn(cmd, args, {
      cwd: workspaceDir,
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        CI: 'true',
        NODE_ENV: 'test',
        // Advisory node limits
        NODE_OPTIONS: '--max-old-space-size=256',
        // Strip API keys from child environment
        NEBIUS_API_KEY: '',
      },
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, config.limits.testExecutionTimeoutMs);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      resolve({
        command,
        exitCode: 1,
        stdout,
        stderr: `Failed to spawn test runner: ${err.message}`,
        durationMs,
        counts: { total: 0, passed: 0, failed: 0, skipped: 0, errors: 1 },
        available: false,
        unavailableReason: `Runner execution error: ${err.message}`,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;

      if (timedOut) {
        resolve({
          command,
          exitCode: 124,
          stdout,
          stderr: `Execution timed out after ${config.limits.testExecutionTimeoutMs}ms. Process terminated.`,
          durationMs,
          counts: { total: 0, passed: 0, failed: 0, skipped: 0, errors: 1 },
          available: true,
        });
        return;
      }

      const counts = parseTestCounts(`${stdout}\n${stderr}`);

      resolve({
        command,
        exitCode: code ?? 0,
        stdout,
        stderr,
        durationMs,
        counts,
        available: true,
      });
    });
  });
}
