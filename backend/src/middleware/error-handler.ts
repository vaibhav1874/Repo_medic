import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ModelProviderError } from '../services/model-provider.js';
import { DisallowedCommandError } from '../services/test-runner.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[RepoMedic Error]:', err.message || err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Schema validation error',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof ModelProviderError) {
    const statusCode = err.code === 'AUTH_ERROR' ? 401 : err.code === 'RATE_LIMIT' ? 429 : 502;
    return res.status(statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof DisallowedCommandError) {
    return res.status(403).json({
      error: err.message,
      code: 'COMMAND_DISALLOWED',
    });
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
}
