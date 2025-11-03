export interface JwtPayload {
  sub: string;
  v: number;
  t: 'a' | 'r';
  rid?: string;
  iat?: number;
  exp?: number;
}

export default JwtPayload;
