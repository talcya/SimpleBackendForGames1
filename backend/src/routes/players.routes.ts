import express from 'express';
import UserModel from '../models/user';
import LeaderboardModel from '../models/leaderboard';
import type { Server as IOServer } from 'socket.io';
import type { Application } from 'express';

const router = express.Router();

// Submit score for a player
router.post('/:playerId/score', async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { score, leaderboardId = 'global' } = req.body;
    if (typeof score !== 'number') return res.status(400).json({ message: 'score must be a number' });

    const user = await UserModel.findById(playerId).exec();
    if (!user) return res.status(404).json({ message: 'player not found' });

    // Update high score if greater
    if (score > (user.highScore || 0)) {
      user.highScore = score;
      await user.save();
    }

    // Insert leaderboard entry
    const entry = new LeaderboardModel({ leaderboardId, playerId: user._id, score, submittedAt: new Date() });
    await entry.save();

    // Emit leaderboard update via Socket.IO if available
    const appWithIo = req.app as Application & { locals: { io?: IOServer } };
    const io = appWithIo.locals.io;
    if (io) {
      io.emit('leaderboard:update', { leaderboardId, playerId: user._id, score });
    }

    res.json({ ok: true, score: user.highScore });
  } catch (err) {
    next(err);
  }
});

export default router;
