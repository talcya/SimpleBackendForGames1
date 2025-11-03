import express from 'express';
import NotificationModel from '../models/notification';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { requireOwnerParam } from '../middleware/ownership';

const router = express.Router();

// POST /v1/notifications (protected - moderator+)
router.post('/', requireAuth, requireRole('moderator'), async (req, res, next) => {
  try {
    const body = req.body;
    const n = await NotificationModel.create(body);
    res.status(201).json(n);
  } catch (err) {
    next(err);
  }
});

// GET /v1/notifications/user/:userId (protected - owner)
router.get('/user/:userId', requireAuth, requireOwnerParam('userId'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    // Minimal: return notifications targeted to 'all' or to user's id
    // owner check performed by middleware
    const rows = await NotificationModel.find({ $or: [{ targets: 'all' }, { targets: userId }] }).sort({ createdAt: -1 }).lean();
    res.json({ notifications: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
