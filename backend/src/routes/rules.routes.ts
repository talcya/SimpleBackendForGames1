import express from 'express';
import RuleModel from '../models/rule';
import { requireAuth } from '../middleware/auth';

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

// POST /v1/rules (protected)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = req.body;
    const rule = await RuleModel.create(payload);
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
});

export default router;
