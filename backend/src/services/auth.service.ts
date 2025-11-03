import UserModel, { IUser } from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { JwtPayload } from '../types/jwt';

export async function signup(email: string | undefined, displayName: string, password?: string) {
  const exists = await UserModel.findOne({ $or: [{ email }, { displayName }] }).exec();
  if (exists) throw new Error('User already exists');

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const user = new UserModel({ email, displayName, passwordHash });
  await user.save();
  // issue tokens
  const access = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, t: 'a' }, config.jwtSecret, { expiresIn: '15m' });
  const refresh = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, rid: user.refreshTokenId, t: 'r' }, config.jwtSecret, { expiresIn: '7d' });
  return { user, accessToken: access, refreshToken: refresh };
}

export async function loginWithPassword(email: string, password: string) {
  const user = await UserModel.findOne({ email }).exec();
  if (!user) throw new Error('Invalid credentials');
  if (!user.passwordHash) throw new Error('No password set for user');

  const ok = await bcrypt.compare(password, user.passwordHash as string);
  if (!ok) throw new Error('Invalid credentials');

  const access = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, t: 'a' }, config.jwtSecret, { expiresIn: '15m' });
  const refresh = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, rid: user.refreshTokenId, t: 'r' }, config.jwtSecret, { expiresIn: '7d' });

  return { user, accessToken: access, refreshToken: refresh };
}

export function issueTokenForUser(user: IUser) {
  const access = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, t: 'a' }, config.jwtSecret, { expiresIn: '15m' });
  const refresh = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, rid: user.refreshTokenId, t: 'r' }, config.jwtSecret, { expiresIn: '7d' });
  return { accessToken: access, refreshToken: refresh };
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (payload?.t === 'r') return payload;
  } catch (error_) {
    // invalid token
  }
  return null;
}
