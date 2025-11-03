import express from 'express';
import GroupModel from '../models/group';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// GET /v1/groups
router.get('/', async (req, res, next) => {
  try {
    const rows = await GroupModel.find({}).lean();
    res.json({ groups: rows });
  } catch (err) {
    next(err);
  }
});

// POST /v1/groups (protected)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const row = await GroupModel.create(req.body);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PUT /v1/groups/:id/members (protected)
router.put('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { add = [], remove = [] } = req.body;
    const g = await GroupModel.findById(id);
    if (!g) return res.status(404).json({ message: 'group not found' });
    // add
  for (const m of add) if (!g.members.some((x: any) => x.toString() === m)) g.members.push(m);
  // remove
  g.members = g.members.filter((x: any) => !remove.includes(x.toString()));
    await g.save();
    res.json(g);
  } catch (err) {
    next(err);
  }
});

export default router;
