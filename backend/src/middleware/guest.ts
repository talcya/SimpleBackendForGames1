import { Request, Response, NextFunction } from 'express';
import { optionalAuth } from './auth';

// optionalAuth will populate req.user when Authorization header is present and valid.
// This middleware extends that behavior by also accepting an X-Guest-Id header when
// the request is not authenticated. It attaches req.guest = { guestId } when present.
export async function optionalAuthOrGuest(req: Request, res: Response, next: NextFunction) {
  // first attempt to authenticate normally (if Authorization header present)
  await new Promise<void>((resolve) => {
    optionalAuth(req, res, () => resolve());
  });

  if (req.user) return next();

  // Don't mutate req with new ambient properties here to keep typing simple;
  // routes can read X-Guest-Id header or body.guestId as needed.
  return next();
}

export default { optionalAuthOrGuest };
