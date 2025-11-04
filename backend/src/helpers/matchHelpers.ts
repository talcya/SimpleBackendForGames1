import mongoose from 'mongoose';
import MatchModel, { IMatch } from '../models/match';
import GameEventModel from '../models/game-event';
import PlayerScoreModel from '../models/player-score';
import PlayerActivityModel from '../models/player-activity';

/**
 * Create a Match record from a GameSession-like document
 */
export async function createMatchFromSession(sessionDoc: any, matchOptions: Partial<IMatch> = {}) {
  const match = await MatchModel.create({
    gameId: sessionDoc.gameId || 'default',
    sessionRef: sessionDoc._id,
    createdBy: sessionDoc.host || null,
    participants: (sessionDoc.members || []).map((m: any) => ({ player: m.player, joinAt: m.connectedAt })),
    matchMeta: matchOptions.matchMeta || {},
    status: 'pending',
    ...matchOptions,
  });
  // link session if possible
  try {
    if (sessionDoc && sessionDoc.matchRef !== undefined) {
      sessionDoc.matchRef = match._id;
      if (typeof sessionDoc.save === 'function') await sessionDoc.save();
    }
  } catch (err) {
    // non-fatal
    // console.warn('failed linking session.matchRef', err);
  }
  return match;
}

/**
 * End match and process final participant data.
 * This implementation focuses on PlayerScore upserts and PlayerActivity creation.
 * Wallet/CurrencyTransaction updates are TODO in a follow-up task.
 */
export async function endMatchAndProcess(matchId: mongoose.Types.ObjectId | string, finalParticipantData: Array<any>) {
  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    try {
      session.startTransaction();
    } catch (txErr) {
      // Transactions may not be supported in the current Mongo setup (single node).
      // Fall back to non-transactional behavior by clearing session.
      session.endSession();
      session = null;
    }
  } catch (e) {
    session = null;
  }
  try {
    const q = MatchModel.findById(matchId);
    if (session) q.session(session as any);
    const match = await q;
    if (!match) throw new Error('match not found');

    if (match.processed) {
      // idempotent guard: already processed
      if (session) {
        await session.commitTransaction();
        session.endSession();
      }
      return match;
    }

    match.endedAt = new Date();
    match.status = 'finished';

    // merge final data
    for (const p of finalParticipantData) {
      const idx = match.participants.findIndex((x: any) => x.player.toString() === p.player.toString());
      if (idx >= 0) {
        match.participants[idx].finalScore = p.finalScore;
        match.participants[idx].stats = p.stats || match.participants[idx].stats;
        match.participants[idx].place = p.place;
      } else {
        match.participants.push({ player: p.player, finalScore: p.finalScore, stats: p.stats, place: p.place });
      }
    }

    match.scoreSummary = { topScore: Math.max(...match.participants.map((x: any) => (x.finalScore || 0))) };
    await match.save(session ? { session } : undefined);

    // update player scores and create activities
    for (const p of match.participants) {
      // upsert PlayerScore using $max to keep high score
      await PlayerScoreModel.findOneAndUpdate(
        { player: p.player, gameId: match.gameId, scope: 'global' },
        { $max: { score: p.finalScore || 0 }, $set: { updatedAt: new Date() } },
        session ? { upsert: true, session } : { upsert: true }
      );

      // create player activity
      if (session) {
        await PlayerActivityModel.create([
          {
            player: p.player,
            eventRef: null,
            type: 'high_score',
            details: { match: match._id, place: p.place, finalScore: p.finalScore },
          },
        ], { session });
      } else {
        await PlayerActivityModel.create([
          {
            player: p.player,
            eventRef: null,
            type: 'high_score',
            details: { match: match._id, place: p.place, finalScore: p.finalScore },
          },
        ]);
      }
    }

    match.processed = true;
    await match.save(session ? { session } : undefined);

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }
    return match;
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw err;
  }
}

export default { createMatchFromSession, endMatchAndProcess };
