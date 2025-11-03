import { Request, Response, NextFunction } from 'express';
import { Role } from '../models/user';

// Note: request augmentation for `req.user` exists in src/types/express-augment.d.ts

function unauthorized(res: Response) {
  return res.status(403).json({ message: 'Forbidden' });
}

export const requireRole = (required: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: 'Authentication required' });
    // if user object contains role property, compare
    if (user.role === required) return next();
    // allow admins to bypass
    if (user.role === 'admin') return next();
    return unauthorized(res);
  };
};

export const requireAnyRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: 'Authentication required' });
    if (roles.includes(user.role)) return next();
    // admins always allowed
    if (user.role === 'admin') return next();
    return unauthorized(res);
  };
};

export default { requireRole, requireAnyRole };
