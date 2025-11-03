import express from 'express';
import GuestModel from '../models/guest';

const router = express.Router();

// Create a new guest session. Returns guestId used by clients to track session.
router.post('/', async (req, res, next) => {
  try {
    const guest = new GuestModel({});
    await guest.save();
    res.json({ guestId: guest.guestId, createdAt: guest.createdAt });
  } catch (err) {
    next(err);
  }
});

router.get('/:guestId', async (req, res, next) => {
  try {
    const { guestId } = req.params;
    const guest = await GuestModel.findOne({ guestId }).exec();
    if (!guest) return res.status(404).json({ message: 'guest not found' });
    res.json({ guestId: guest.guestId, highScore: guest.highScore, inventory: guest.inventory, lastActive: guest.lastActive });
  } catch (err) {
    next(err);
  }
});

export default router;
