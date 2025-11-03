import { Request, Response, NextFunction } from 'express';

function extractIp(raw?: string | string[]): string {
  if (!raw) return '';
  const v = Array.isArray(raw) ? raw[0] : raw;
  // if header contains a list, take first
  const first = v.split(',')[0].trim();
  return first;
}

function normalizeIp(ip: string): string {
  if (!ip) return '';
  // remove IPv6 zone id (e.g. fe80::1%lo0)
  const zoneIdx = ip.indexOf('%');
  if (zoneIdx !== -1) ip = ip.slice(0, zoneIdx);
  // handle IPv4-mapped IPv6 addresses like ::ffff:127.0.0.1
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const a = Number(parts[0]);
  const b = Number(parts[1]);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 127) return true; // loopback 127.0.0.0/8
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  if (!ip) return false;
  if (ip === '::1') return true;
  // Unique local addresses fc00::/7 (fc or fd)
  const lower = ip.toLowerCase();
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  return false;
}

export function requirePrivateNetwork(req: Request, res: Response, next: NextFunction) {
  // Prefer X-Forwarded-For if present
  const forwarded = req.headers['x-forwarded-for'];
  let ip = extractIp(forwarded) || req.ip || (req.socket && (req.socket.remoteAddress || '')) || '';
  ip = normalizeIp(ip);

  if (isPrivateIPv4(ip) || isPrivateIPv6(ip)) return next();

  return res.status(403).json({ message: 'Forbidden: access limited to private network' });
}

export default requirePrivateNetwork;
