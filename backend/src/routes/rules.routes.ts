import express from 'express';
import RuleModel from '../models/rule';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = express.Router();

// GET /v1/rules
router.get('/', async (req, res, next) => {
  try {
    const rules = await RuleModel.find({}).lean();
    res.json({ rules });
  } catch (err) {
    next(err);
  }
});

// POST /v1/rules (protected - moderator+)
router.post('/', requireAuth, requireRole('moderator'), async (req, res, next) => {
  try {
    const payload = req.body;
    const rule = await RuleModel.create(payload);
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
});

export default router;
