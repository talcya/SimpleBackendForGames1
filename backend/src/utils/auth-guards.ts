export interface AuthUser {
  id: string;
  v: number;
}

export function isAuthUser(u: unknown): u is AuthUser & Record<string, unknown> {
  if (!u || typeof u !== 'object') return false;
  const o = u as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.v === 'number';
}

export default isAuthUser;
