import express from 'express';
import { requireAuth } from '../middleware/auth';
import ItemModel from '../models/item';
import UserModel from '../models/user';

const router = express.Router();

// GET /v1/store/items
router.get('/items', async (req, res, next) => {
  try {
    const items = await ItemModel.find({ isActive: true }).lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// POST /v1/store/purchase (protected)
router.post('/purchase', requireAuth, async (req, res, next) => {
  try {
    const { userId, itemId } = req.body;
    if (!userId || !itemId) return res.status(400).json({ message: 'missing userId or itemId' });
    // ensure the caller is the same user (or admin in future)
    // @ts-ignore
    if (req.user?.id !== userId) return res.status(403).json({ message: 'forbidden' });
    const [user, item] = await Promise.all([UserModel.findById(userId), ItemModel.findById(itemId)]);
    if (!user) return res.status(404).json({ message: 'user not found' });
  if (!item?.isActive) return res.status(404).json({ message: 'item not available' });

    // Minimal: push item id into user's inventory
    // (In production, you'd check currency, apply offers/discounts, etc.)
  // ensure inventory exists on the document
  // @ts-ignore
  if (!Array.isArray(user.inventory)) user.inventory = [];
    // ensure no duplicates for simplicity
  if (!user.inventory.some((id: any) => id.toString() === item._id.toString())) {
      // @ts-ignore
      user.inventory.push(item._id);
      await user.save();
    }

    res.json({ ok: true, item: { id: item._id, name: item.name } });
  } catch (err) {
    next(err);
  }
});

export default router;
