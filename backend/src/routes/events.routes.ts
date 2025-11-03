import express from 'express';
import EventLogModel from '../models/event-log';
import UserModel from '../models/user';
import RuleModel from '../models/rule';
import ViolationModel from '../models/violation';
import { requireAuth } from '../middleware/auth';
import { optionalAuthOrGuest } from '../middleware/guest';
import { requireOwnerBody, requireOwnerParam } from '../middleware/ownership';

const router = express.Router();

// POST /v1/events (accepts authenticated user OR a guest via X-Guest-Id)
router.post('/', optionalAuthOrGuest, async (req, res, next) => {
  try {
    const { playerId, sessionId: bodySessionId, eventType, payload, gameMode } = req.body;
    const headerGuestId = (req.headers['x-guest-id'] as string) || undefined;

    // require either a playerId (authenticated) or a sessionId (guest)
    if (!playerId && !bodySessionId && !headerGuestId) return res.status(400).json({ message: 'missing playerId or sessionId' });

    // If playerId is provided, ensure caller matches playerId
    if (playerId) {
      if (!req.user || (req.user as any).id !== playerId) return res.status(403).json({ message: 'forbidden' });
    }

    const finalSessionId = bodySessionId || headerGuestId || undefined;

    const evData: any = { eventType, payload };
    if (playerId) evData.playerId = playerId;
    if (!playerId && finalSessionId) evData.sessionId = finalSessionId;

    const ev = new EventLogModel(evData);
    await ev.save();

    // Auto-update high score if payload contains score (only for authenticated users)
    const score = payload && (payload as any).score;
    if (typeof score === 'number' && playerId) {
      const user = await UserModel.findById(playerId);
      if (user && score > (user.highScore || 0)) {
        user.highScore = score;
        await user.save();
      }
    }

    // Minimal synchronous rule check for snapshots (kept small) - only for users
    if (gameMode && eventType === 'snapshot' && playerId) {
      const rule = await RuleModel.findOne({ name: gameMode, active: true }).exec();
      if (rule) {
        const vValue = payload && ((payload as any).value ?? (payload as any).speed);
        if (typeof vValue === 'number' && vValue > (rule.threshold || 0)) {
          // create or increment violation
          const existing = await ViolationModel.findOne({ playerId, ruleId: rule._id, resolved: false }).exec();
          if (existing) {
            existing.count += 1;
            existing.lastViolationAt = new Date();
            await existing.save();
          } else {
            await ViolationModel.create({ playerId, ruleId: rule._id, count: 1, firstViolationAt: new Date(), lastViolationAt: new Date(), details: `value:${vValue}` });
          }
        }
      }
    }

    res.status(202).json({ ok: true, id: ev._id });
  } catch (err) {
    next(err);
  }
});

// GET /v1/events/user/:userId (protected - owner)
router.get('/user/:userId', requireAuth, requireOwnerParam('userId'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const rows = await EventLogModel.find({ playerId: userId }).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ events: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
