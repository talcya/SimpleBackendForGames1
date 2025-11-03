import { GameEventModel } from '../models/game-event';
import { RuleModel } from '../models/rule';
import { PlayerScoreModel } from '../models/player-score';
import { PlayerActivityModel } from '../models/player-activity';
import PlayerActivityGuardModel from '../models/player-activity-guard';
import { PLAYER_ACTIVITY_DEDUPE_MS } from '../config';
import { ViolationModel } from '../models/violation';

/**
 * processGameEvent: record rules, update leaderboard (if score present), and mark processed
 */
export async function processGameEvent(eventDoc: any) {
  try {
    const { player, payload, type, gameId } = eventDoc;

    if (type === 'snapshot' && gameId) {
      const rules = await RuleModel.find({ gameId, active: true }).lean();
      for (const rule of rules) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        checkRuleAgainstPayload(rule, payload, player, eventDoc);
      }
    }

    if (payload && typeof (payload as any).score === 'number') {
      await upsertPlayerScore(player, gameId || 'default', (payload as any).score, (payload as any).scope || 'global', (payload as any).localId || null);
    }

    eventDoc.processed = true;
    eventDoc.processedAt = new Date();
    await eventDoc.save();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('processGameEvent err', err);
  }
}

export async function upsertPlayerScore(playerId: any, gameId = 'default', newScore = 0, scope = 'global', localId: any = null) {
  const q: any = { player: playerId, gameId, scope, localId };
  // Read pre-update doc snapshot (if any) to help decide whether to record activity.
  const pre: any = await PlayerScoreModel.findOne(q).select('score').lean();

  // Use an aggregation-pipeline update so we can conditionally set updatedAt
  // only when the computed max score is greater than the previous score.
  const now = new Date();
  const SCORE_SENTINEL = -9e18; // safe negative sentinel
  const pipeline: any = [
    {
      $set: {
        score: { $max: [{ $ifNull: ['$score', SCORE_SENTINEL] }, newScore] },
        updatedAt: {
          $cond: [
            { $gt: [{ $max: [{ $ifNull: ['$score', SCORE_SENTINEL] }, newScore] }, { $ifNull: ['$score', SCORE_SENTINEL] }] },
            now,
            '$updatedAt',
          ],
        },
        player: playerId,
        gameId,
        scope,
        localId,
        createdAt: { $ifNull: ['$createdAt', now] },
      },
    },
  ];

  // updatedDoc is the document after the pipeline update.
  const updated: any = await PlayerScoreModel.findOneAndUpdate(q, pipeline, { upsert: true, new: true }).lean();

  // If the stored score equals the one we attempted to write, and it represents
  // an increase over the previous value (or the doc was created), record activity.
  const increased = !pre || (typeof pre.score === 'number' && Number(newScore) > Number(pre.score));
  if (updated && Number(updated.score) === Number(newScore) && increased) {
    const prev = pre && typeof pre.score === 'number' ? pre.score : null;
    // Use an atomic per-player guard document so concurrent workers can
    // race on a single field update instead of doing a read-then-create.
    // The guard update sets lastActivityAt=now only when the previous
    // lastActivityAt is older than the dedupe window (or missing).
    const recentWindowMs = PLAYER_ACTIVITY_DEDUPE_MS || 5000;
    const thresholdDate = new Date(Date.now() - recentWindowMs);

    // Perform an aggregation-pipeline update on the guard doc. We request
    // the pre-update document (new: false) so we can decide if we "acquired"
    // the right to emit an activity.
    const prevGuard: any = await PlayerActivityGuardModel.findOneAndUpdate(
      { player: playerId },
      [
        {
          $set: {
            lastActivityAt: {
              $cond: [
                { $or: [{ $lt: ['$lastActivityAt', thresholdDate] }, { $eq: ['$lastActivityAt', null] }] },
                new Date(),
                '$lastActivityAt',
              ],
            },
          },
        },
      ],
      { upsert: true, new: false }
    ).exec();

    // If there was no previous guard doc (prevGuard === null), we created it
    // with lastActivityAt=now and should emit activity. If prevGuard exists,
    // only emit when its lastActivityAt is missing or older than threshold.
    const allowActivity =
      !prevGuard || !prevGuard.lastActivityAt || prevGuard.lastActivityAt < thresholdDate;

    if (allowActivity) {
      await PlayerActivityModel.create({ player: playerId, type: 'high_score', details: { prev, newScore, gameId } });
    }

    return { updated: true, prev };
  }

  return { updated: false };
}

export async function checkRuleAgainstPayload(rule: any, payload: any, playerId: any, eventRef: any) {
  const action = rule.action;
  const attr = payload && payload[action];
  if (typeof attr !== 'number') return;
  const normal = (rule.normals && rule.normals[action]) || {};
  const { min, max, threshold } = normal as any;
  if (typeof max === 'number' && attr > max) {
    const allowedMax = typeof threshold === 'number' ? threshold : max;
    if (attr > allowedMax) {
      await ViolationModel.create({ player: playerId, ruleId: rule._id, type: 'Cheat', evidence: { attr, max, threshold }, count: 1 });
      await PlayerActivityModel.create({ player: playerId, eventRef: eventRef._id, type: 'violation', details: { rule: rule.name, attr } });
    } else {
      await PlayerActivityModel.create({ player: playerId, eventRef: eventRef._id, type: 'alert', details: { rule: rule.name, attr, note: 'above normal but within threshold' } });
    }
  }
}
