const { connectMongo } = require('../../dist/config').default || require('../../dist/config');
const RuleModel = require('../../dist/models/rule').default;
const EventLogModel = require('../../dist/models/event-log').default;
const UserModel = require('../../dist/models/user').default;
const ViolationModel = require('../../dist/models/violation').default;
const ruleEngine = require('../../dist/services/rule-engine.service').default;

describe('rule engine unit (fast)', () => {
  beforeAll(async () => {
    // ensure mongoose connected for these tests
    try {
      if (connectMongo) await connectMongo();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('connectMongo failed in unit test setup', err);
      throw err;
    }
  });

  afterAll(async () => {
    try {
      const mongoose = require('mongoose');
      if (mongoose && mongoose.disconnect) await mongoose.disconnect();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('mongoose disconnect failed in unit test cleanup:', err && err.message ? err.message : err);
    }
  });

  it('creates a Violation for a single event when threshold is 1', async () => {
    const user = await UserModel.create({ displayName: `unit-${Date.now()}` });
    const eventType = `unit-event-${Date.now()}`;
    const rule = await RuleModel.create({ name: eventType, action: 'flag', threshold: 1, windowSeconds: 60 });

    const ev = await EventLogModel.create({ playerId: user._id, eventType, payload: null });

    // call evaluateEventLog directly
    await ruleEngine.evaluateEventLog(ev._id.toHexString());

    const violation = await ViolationModel.findOne({ ruleId: rule._id, playerId: user._id }).exec();
    expect(violation).toBeTruthy();
    expect(violation.count).toBeGreaterThanOrEqual(1);

    // cleanup
    await EventLogModel.deleteMany({ playerId: user._id, eventType }).exec();
    await ViolationModel.deleteMany({ playerId: user._id }).exec();
    await RuleModel.deleteOne({ _id: rule._id }).exec();
    await UserModel.deleteOne({ _id: user._id }).exec();
  }, 15000);
});
