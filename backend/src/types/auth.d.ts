import { Request } from 'express';

export interface AuthUser {
  id: string;
  v: number;
}

// Make `user` compatible with existing passport `User` type by allowing extra properties.
export interface AuthRequest extends Request {
  user?: AuthUser & Record<string, unknown>;
}

export {};
