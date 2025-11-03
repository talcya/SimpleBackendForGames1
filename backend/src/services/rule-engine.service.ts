import { EventLogModel } from '../models/event-log';
import { RuleModel } from '../models/rule';
import { ViolationModel } from '../models/violation';
import mongoose from 'mongoose';

/**
 * Evaluate a single EventLog entry against active rules.
 * - Matches rules where rule.name === event.eventType
 * - Counts events for the same player and eventType within rule.windowSeconds
 * - Creates or updates a Violation when threshold exceeded
 * - Marks EventLog.evaluated and records matchedRuleIds
 */
export async function evaluateEventLog(eventLogId: string) {
  const event = await EventLogModel.findById(eventLogId).exec();
  if (!event) return null;
  if (event.evaluated) return event;

  const now = new Date();

  // find rules that match this event type
  const rules = await RuleModel.find({ name: event.eventType, active: true }).exec();
  const matchedRuleIds: mongoose.Types.ObjectId[] = [];

  for (const rule of rules) {
    // only evaluate if rule applies to events with a playerId
    if (!event.playerId) continue;

    const windowStart = new Date(now.getTime() - rule.windowSeconds * 1000);

    const count = await EventLogModel.countDocuments({
      playerId: event.playerId,
      eventType: event.eventType,
      createdAt: { $gte: windowStart, $lte: now },
    }).exec();

    if (count >= rule.threshold) {
      matchedRuleIds.push(rule._id);

      // upsert violation
      const existing = await ViolationModel.findOne({ ruleId: rule._id, playerId: event.playerId }).exec();
      if (existing) {
        existing.count = (existing.count || 0) + 1;
        existing.lastViolationAt = now;
        existing.resolved = false;
        await existing.save();
      } else {
        await ViolationModel.create({
          ruleId: rule._id,
          playerId: event.playerId,
          count: 1,
          firstViolationAt: now,
          lastViolationAt: now,
          resolved: false,
        });
      }
    }
  }

  event.evaluated = true;
  if (matchedRuleIds.length) {
    event.matchedRuleIds = matchedRuleIds;
    event.evaluationResult = { matched: matchedRuleIds.map((id) => id.toHexString()) };
  }
  await event.save();

  return event;
}

/**
 * Process pending (unevaluated) EventLogs in batches.
 */
export async function processPendingEvents(limit = 100) {
  const pending = await EventLogModel.find({ evaluated: false }).sort({ createdAt: 1 }).limit(limit).exec();
  for (const ev of pending) {
    // fire and forget per item but await to keep memory bounded
    // we intentionally await so failures surface during CI runs
    // and don't overwhelm the DB with parallel queries.
    // eslint-disable-next-line no-await-in-loop
    // evaluateEventLog will skip if already evaluated
    // (useful if multiple processors run concurrently)
    // eslint-disable-next-line no-await-in-loop
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    await evaluateEventLog(ev._id.toHexString());
  }
  return pending.length;
}

export default { evaluateEventLog, processPendingEvents };
