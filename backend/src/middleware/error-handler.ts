import { Request, Response, NextFunction } from 'express';

// keep the `next` parameter for Express error handler signature; it's intentionally unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Minimal unified error handler
  // eslint-disable-next-line no-console
  console.error(err);
  if (typeof err === 'object' && err !== null) {
    const e = err as { status?: number; message?: string };
    const status = e.status ?? 500;
    res.status(status).json({ error: e.message ?? 'Internal Server Error' });
    return;
  }
  if (typeof err === 'string') {
    res.status(500).json({ error: err });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
