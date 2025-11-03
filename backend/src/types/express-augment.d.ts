import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id?: string;
      v?: number;
      [key: string]: unknown;
    };
    guest?: {
      guestId?: string;
    };
  }
}

export {};
