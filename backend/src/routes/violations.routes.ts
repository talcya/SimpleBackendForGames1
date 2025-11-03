import express from 'express';
import ViolationModel from '../models/violation';
import { requireAuth } from '../middleware/auth';
import { requireOwnerParam } from '../middleware/ownership';

const router = express.Router();

// GET /v1/violations/user/:userId (protected - owner)
router.get('/user/:userId', requireAuth, requireOwnerParam('userId'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const rows = await ViolationModel.find({ playerId: userId }).sort({ lastViolationAt: -1 }).lean();
    res.json({ violations: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
