import express from 'express';
import OfferModel from '../models/offer';
import UserModel from '../models/user';
import { requireAuth } from '../middleware/auth';
import { requireOwnerBody } from '../middleware/ownership';

const router = express.Router();

// GET /v1/offers/active
router.get('/active', async (req, res, next) => {
  try {
    const now = new Date();
    const rows = await OfferModel.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    }).lean();
    res.json({ offers: rows });
  } catch (err) {
    next(err);
  }
});

// POST /v1/offers/redeem (protected - owner)
router.post('/redeem', requireAuth, requireOwnerBody('userId'), async (req, res, next) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ message: 'missing userId or code' });
    const offer = await OfferModel.findOne({ code, isActive: true }).exec();
    if (!offer) return res.status(404).json({ message: 'offer not found' });
    const now = new Date();
    if (offer.startDate && offer.startDate > now) return res.status(400).json({ message: 'offer not started' });
    if (offer.endDate && offer.endDate < now) return res.status(400).json({ message: 'offer expired' });
    if (offer.maxUses && offer.usedBy.length >= (offer.maxUses || 0)) return res.status(400).json({ message: 'offer fully used' });
    if (offer.usedBy.some((u: any) => u.toString() === userId)) return res.status(400).json({ message: 'offer already used by user' });
    offer.usedBy.push(userId);
    await offer.save();
    // optionally apply items to user inventory here
    const user = await UserModel.findById(userId);
    res.json({ ok: true, offer: { id: offer._id, name: offer.name }, user: user ? { id: user._id } : null });
  } catch (err) {
    next(err);
  }
});

export default router;
