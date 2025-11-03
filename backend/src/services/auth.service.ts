import UserModel, { IUser } from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { JwtPayload } from '../types/jwt';

export async function signup(email: string | undefined, displayName: string, password?: string, guestId?: string) {
  const exists = await UserModel.findOne({ $or: [{ email }, { displayName }] }).exec();
  if (exists) throw new Error('User already exists');

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  // If a guestId is provided attempt to migrate guest data atomically using a MongoDB transaction
  if (guestId) {
    const mongoose = require('mongoose') as typeof import('mongoose');
    const session = await mongoose.startSession();
    let usedTransaction = false;
    try {
      // attempt to start a transaction; standalone MongoDB will throw here
      try {
        session.startTransaction();
        usedTransaction = true;
      } catch (txErr) {
        // Transactions unavailable (e.g., standalone mongod). We'll fall back to
        // a non-transactional migration below. Log the condition but continue.
        // eslint-disable-next-line no-console
        console.warn('Transactions not available; falling back to non-transactional guest migration:', (txErr as any)?.message ?? txErr);
      }

      const user = new UserModel({ email, displayName, passwordHash });
      // save (within transaction if available)
      if (usedTransaction) await user.save({ session });
      else await user.save();

      // migrate event logs with sessionId -> set playerId and remove sessionId
      const EventLogModel = require('../models/event-log').EventLogModel;
      if (usedTransaction) {
        await EventLogModel.updateMany({ sessionId: guestId }, { $set: { playerId: user._id }, $unset: { sessionId: '' } }, { session });
      } else {
        await EventLogModel.updateMany({ sessionId: guestId }, { $set: { playerId: user._id }, $unset: { sessionId: '' } }).exec();
      }

      // migrate inventory from Guest to User and remove guest record
      const GuestModel = require('../models/guest').default;
      const guest = usedTransaction ? await GuestModel.findOne({ guestId }).session(session).exec() : await GuestModel.findOne({ guestId }).exec();
      if (guest) {
        // debug: log inventory sizes to help trace guest->user migration
        // eslint-disable-next-line no-console
        console.debug('Guest migration: guest.inventory length=', guest.inventory?.length || 0, 'user.inventory length before=', (user.inventory || []).length);
        if (guest.inventory?.length) {
          user.inventory = (user.inventory || []).concat(guest.inventory);
        }
        // eslint-disable-next-line no-console
        console.debug('Guest migration: user.inventory length after=', (user.inventory || []).length);
        user.originalGuestId = guestId;
        if (usedTransaction) await user.save({ session });
        else await user.save();
        if (usedTransaction) {
          await GuestModel.deleteOne({ guestId }, { session });
        } else {
          await GuestModel.deleteOne({ guestId }).exec();
        }
      }

      if (usedTransaction) await session.commitTransaction();

      // emit an explicit migration-complete event for tests to wait on
      try {
        // safe to call even if there are no listeners
        // include a small amount of metadata about migrated inventory to help tests
        const migratedInventoryCount = (guest && Array.isArray(guest.inventory)) ? guest.inventory.length : 0;
        const migratedInventoryIds = (guest && Array.isArray(guest.inventory)) ? guest.inventory.map((id: any) => id.toString()) : [];
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        (process as any).emit('guest:migrated', { userId: user._id.toString(), guestId, migratedInventoryCount, migratedInventoryIds });
      } catch (e) {
        // ignore
      }

      const access = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, t: 'a' }, config.jwtSecret, { expiresIn: '15m' });
      const refresh = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, rid: user.refreshTokenId, t: 'r' }, config.jwtSecret, { expiresIn: '7d' });
      return { user, accessToken: access, refreshToken: refresh };
    } catch (err) {
      const msg = (err && (err as any).message) || '';
      const code = (err && (err as any).code) || undefined;
      // Handle environments where transactions are unsupported (standalone mongod)
      let fallbackAttempted = false;
      if (code === 20 || String(msg).includes('Transaction numbers are only allowed')) {
        try {
          // Reconcile by doing a best-effort non-transactional migration
          let user = null;
          try {
            user = await UserModel.findOne({ $or: [{ email }, { displayName }] }).exec();
          } catch (_) {
            // ignore
          }
          if (!user) {
            user = new UserModel({ email, displayName, passwordHash });
            await user.save();
          }

          const EventLogModel = require('../models/event-log').EventLogModel;
          await EventLogModel.updateMany({ sessionId: guestId }, { $set: { playerId: user._id }, $unset: { sessionId: '' } }).exec();

          const GuestModel = require('../models/guest').default;
          const guest = await GuestModel.findOne({ guestId }).exec();
          if (guest) {
            if (guest.inventory?.length) user.inventory = (user.inventory || []).concat(guest.inventory);
            user.originalGuestId = guestId;
            await user.save();
            await GuestModel.deleteOne({ guestId }).exec();
          }

          try {
            const migratedInventoryCount = (guest && Array.isArray(guest.inventory)) ? guest.inventory.length : 0;
            const migratedInventoryIds = (guest && Array.isArray(guest.inventory)) ? guest.inventory.map((id: any) => id.toString()) : [];
            (process as any).emit('guest:migrated', { userId: user._id.toString(), guestId, migratedInventoryCount, migratedInventoryIds });
          } catch (e) {}
          const access = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, t: 'a' }, config.jwtSecret, { expiresIn: '15m' });
          const refresh = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, rid: user.refreshTokenId, t: 'r' }, config.jwtSecret, { expiresIn: '7d' });
          return { user, accessToken: access, refreshToken: refresh };
        } catch (fallbackErr) {
          // if fallback also fails, log and allow other fallback attempt below
          // eslint-disable-next-line no-console
          console.error('Guest migration fallback failed', fallbackErr);
          fallbackAttempted = true;
        }
      }

      // If we were using a transaction but the above special-case fallback didn't run
      // (or failed), attempt a generic non-transactional best-effort migration as a last resort.
      if (usedTransaction && !fallbackAttempted) {
        try {
          let user = null;
          try {
            user = await UserModel.findOne({ $or: [{ email }, { displayName }] }).exec();
          } catch (_) {}
          if (!user) {
            user = new UserModel({ email, displayName, passwordHash });
            await user.save();
          }

          const EventLogModel = require('../models/event-log').EventLogModel;
          await EventLogModel.updateMany({ sessionId: guestId }, { $set: { playerId: user._id }, $unset: { sessionId: '' } }).exec();

          const GuestModel = require('../models/guest').default;
          const guest = await GuestModel.findOne({ guestId }).exec();
          if (guest) {
            if (guest.inventory?.length) user.inventory = (user.inventory || []).concat(guest.inventory);
            user.originalGuestId = guestId;
            await user.save();
            await GuestModel.deleteOne({ guestId }).exec();
          }

          try {
            const migratedInventoryCount = (guest && Array.isArray(guest.inventory)) ? guest.inventory.length : 0;
            const migratedInventoryIds = (guest && Array.isArray(guest.inventory)) ? guest.inventory.map((id: any) => id.toString()) : [];
            (process as any).emit('guest:migrated', { userId: user._id.toString(), guestId, migratedInventoryCount, migratedInventoryIds });
          } catch (e) {}
          const access = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, t: 'a' }, config.jwtSecret, { expiresIn: '15m' });
          const refresh = jwt.sign({ sub: user._id.toString(), v: user.jwtVersion, rid: user.refreshTokenId, t: 'r' }, config.jwtSecret, { expiresIn: '7d' });
          return { user, accessToken: access, refreshToken: refresh };
        } catch (genericFallbackErr) {
          // if this also fails, we'll fall through and rethrow the original error below
          // eslint-disable-next-line no-console
          console.error('Generic guest migration fallback failed', genericFallbackErr);
        }
      }

      if (usedTransaction) {
        try {
          // abort transaction on error
          // eslint-disable-next-line no-await-in-loop
          await session.abortTransaction();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to abort transaction', e);
        }
      }
      throw err;
    } finally {
      try {
        session.endSession();
      } catch {}
    }
  }

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
