import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/jwt';
import UserModel from '../models/user';
import { config } from '../config/index';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers?.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    // verify jwtVersion against current user record
    if (payload?.sub) {
      const user = await UserModel.findById(payload.sub).exec();
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      if (user.jwtVersion !== payload.v) return res.status(401).json({ message: 'Unauthorized' });
  // Express.Request.user is augmented to include id & v, so we can assign without casts
      req.user = { id: payload.sub, v: payload.v };
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error_) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers?.authorization;
  if (!auth?.startsWith('Bearer ')) return next();
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (payload && payload.sub) {
      req.user = { id: payload.sub, v: payload.v };
    }
  } catch (error_) {
    // ignore invalid token for optional auth
  }
  return next();
}
