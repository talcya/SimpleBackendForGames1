import { Request, Response, NextFunction } from 'express';

function unauthorized(res: Response) {
  return res.status(403).json({ message: 'forbidden' });
}

export const requireOwnerParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: 'Authentication required' });
    const target = req.params && (req.params as any)[paramName];
    if (!target) return res.status(400).json({ message: `missing param ${paramName}` });
    if (user.id === target) return next();
    return unauthorized(res);
  };
};

export const requireOwnerBody = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: 'Authentication required' });
    const bodyVal = (req.body as any)?.[fieldName];
    if (!bodyVal) return res.status(400).json({ message: `missing body field ${fieldName}` });
    if (user.id === bodyVal) return next();
    return unauthorized(res);
  };
};

export default { requireOwnerParam, requireOwnerBody };
