import express from 'express';
import { PlayerScoreModel } from '../models/player-score';
import { upsertPlayerScore } from '../helpers/gameProcessing';
import { requireAuth } from '../middleware/auth';
import { validateSchema } from '../middleware/validate';
import { playerScoreSchema } from '../validators/player-scores.schema';

const router = express.Router();

// GET /v1/player-scores?gameId=&scope=&localId=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { gameId, scope, localId } = req.query as Record<string, string>;
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const q: any = {};
    if (gameId) q.gameId = gameId;
    if (scope) q.scope = scope;
    if (localId) q.localId = localId;

    const rows = await PlayerScoreModel.find(q).sort({ score: -1 }).limit(limit).lean();
    return res.json({ entries: rows });
  } catch (err) {
    return next(err);
  }
});

// POST /v1/player-scores
// body: { gameId, score, scope, localId }
router.post('/', requireAuth, validateSchema(playerScoreSchema, 'body'), async (req, res, next) => {
  try {
    const { gameId, score, scope, localId } = req.body as any;
    // use authenticated user as the player id
    const player = (req.user as any)?.id;
    if (!player) return res.status(401).json({ message: 'Unauthorized' });
    const result = await upsertPlayerScore(player, gameId || 'default', score, scope || 'global', localId || null);
    return res.json({ ok: true, result });
  } catch (err) {
    return next(err);
  }
});

export default router;
