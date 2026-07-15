import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', errors: error.issues });
  }
  if (error instanceof Error) {
    return res.status(500).json({ message: error.message });
  }
  return res.status(500).json({ message: 'Unexpected server error' });
}
