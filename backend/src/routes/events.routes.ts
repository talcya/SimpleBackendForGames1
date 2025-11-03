import express from 'express';
import EventLogModel from '../models/event-log';
import UserModel from '../models/user';
import RuleModel from '../models/rule';
import ViolationModel from '../models/violation';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// POST /v1/events (protected)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { playerId, eventType, payload, gameMode } = req.body;
    if (!playerId || !eventType) return res.status(400).json({ message: 'missing playerId or eventType' });
    // ensure caller matches playerId
    // @ts-ignore
    if (req.user?.id !== playerId) return res.status(403).json({ message: 'forbidden' });
    const ev = new EventLogModel({ playerId, eventType, payload });
    await ev.save();

    // Auto-update high score if payload contains score
    const score = payload && (payload as any).score;
    if (typeof score === 'number') {
      const user = await UserModel.findById(playerId);
      if (user && score > (user.highScore || 0)) {
        user.highScore = score;
        await user.save();
      }
    }

    // Minimal synchronous rule check for snapshots (kept small)
    if (gameMode && eventType === 'snapshot') {
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
router.get('/user/:userId', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    // only allow owner to fetch their events
    // @ts-ignore
    if (req.user?.id !== userId) return res.status(403).json({ message: 'forbidden' });
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const rows = await EventLogModel.find({ playerId: userId }).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ events: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
