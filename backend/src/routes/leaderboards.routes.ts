import express from 'express';
import UserModel from '../models/user';
import LeaderboardModel from '../models/leaderboard';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// GET /v1/leaderboards/global?limit=100
router.get('/global', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await UserModel.find({}).sort({ highScore: -1 }).limit(limit).select('displayName highScore avatarUrl');
    res.json({ entries: rows });
  } catch (err) {
    next(err);
  }
});

// GET /v1/leaderboards/friends/:userId (protected - owner)
router.get('/friends/:userId', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findById(userId).populate('friends', 'displayName highScore avatarUrl');
    if (!user) return res.status(404).json({ message: 'user not found' });
    // allow only owner to view friends leaderboard for now
    // @ts-ignore
    if (req.user?.id !== userId) return res.status(403).json({ message: 'forbidden' });
    // friends is an array of User documents - sort in-memory by highScore descending
    // @ts-ignore
    const list = (user.friends || []).sort((a: any, b: any) => (b.highScore || 0) - (a.highScore || 0));
    res.json({ entries: list });
  } catch (err) {
    next(err);
  }
});

// GET /v1/leaderboards/local?region=XX
router.get('/local', async (req, res, next) => {
  try {
    // Minimal: just delegate to global for now; extend with geo filtering if User has region
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await LeaderboardModel.find({}).sort({ score: -1 }).limit(limit).lean();
    res.json({ entries: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
