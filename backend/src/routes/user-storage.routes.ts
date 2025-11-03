import express from 'express';
import UserStorageModel from '../models/user-storage';
import { requireAuth } from '../middleware/auth';
import { requireOwnerParam } from '../middleware/ownership';
import { validateSchema } from '../middleware/validate';
import { userStorageSchema } from '../validators/user-storage.schema';

const router = express.Router();

// GET /v1/user-storage/:userId/:key
router.get('/:userId/:key', requireAuth, requireOwnerParam('userId'), async (req, res, next) => {
  try {
    const { userId, key } = req.params;
    const doc = await UserStorageModel.findOne({ user: userId, key }).lean();
    if (!doc) return res.status(404).json({ message: 'not found' });
    return res.json(doc);
  } catch (err) {
    return next(err);
  }
});

// PUT /v1/user-storage/:userId/:key
// body: { data: {...}, meta: {...} }
router.put('/:userId/:key', requireAuth, requireOwnerParam('userId'), validateSchema(userStorageSchema, 'body'), async (req, res, next) => {
  try {
    const { userId, key } = req.params;
    const { data, meta } = req.body || {};
    const update = { data, meta: meta || {}, updatedAt: new Date() } as any;
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const doc = await UserStorageModel.findOneAndUpdate({ user: userId, key }, update, opts).lean();
    return res.json(doc);
  } catch (err) {
    return next(err);
  }
});

export default router;
