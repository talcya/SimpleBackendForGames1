const { createServer } = require('../../dist/app');

let app;
let serverInstance;

beforeAll(async () => {
  const created = await createServer();
  app = created.app;
  serverInstance = created.server;
});

afterAll(async () => {
  if (serverInstance && typeof serverInstance.close === 'function') {
    await new Promise((res) => serverInstance.close(() => res(null)));
  }
  try {
    const mongoose = require('mongoose');
    if (mongoose && mongoose.disconnect) await mongoose.disconnect();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('mongoose disconnect failed in test cleanup:', e && e.message ? e.message : e);
  }
});

describe('Rule engine integration', () => {
  it('creates a Violation when threshold is exceeded', async () => {
  const UserModel = require('../../dist/models/user').default;
  const EventLogModel = require('../../dist/models/event-log').default;
  const RuleModel = require('../../dist/models/rule').default;
  const ViolationModel = require('../../dist/models/violation').default;
  const ruleEngine = require('../../dist/services/rule-engine.service').default;

    // create a user
    const user = await UserModel.create({ displayName: `rtest-${Date.now()}` });

  // create a rule matching a unique eventType with threshold 3
  const eventType = `rapid_action_${Date.now()}`;
  const rule = await RuleModel.create({ name: eventType, action: 'flag', threshold: 3, windowSeconds: 60 });

  // create 3 event logs for the same player
  await EventLogModel.create({ playerId: user._id, eventType, payload: { x: 1 } });
  await EventLogModel.create({ playerId: user._id, eventType, payload: { x: 2 } });
  await EventLogModel.create({ playerId: user._id, eventType, payload: { x: 3 } });

    // process pending events
    const processed = await ruleEngine.processPendingEvents(100);
    expect(processed).toBeGreaterThanOrEqual(1);

    // violation should exist
    const violation = await ViolationModel.findOne({ ruleId: rule._id, playerId: user._id }).exec();
    expect(violation).toBeTruthy();
    expect(violation.count).toBeGreaterThanOrEqual(1);

    // event logs should be marked evaluated
  const logs = await EventLogModel.find({ playerId: user._id, eventType }).exec();
    expect(logs.length).toBeGreaterThanOrEqual(3);
    for (const l of logs) {
      expect(l.evaluated).toBe(true);
      expect(Array.isArray(l.matchedRuleIds)).toBe(true);
    }
  }, 20000);
});
