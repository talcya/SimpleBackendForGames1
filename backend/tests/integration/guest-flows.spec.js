const request = require('supertest');

// Integration tests for guest flows: create guest, post guest events, migrate on signup
describe('Guest flows integration', () => {
  let app;
  let serverInstance;

  beforeAll(async () => {
    const created = await require('../../dist/app').createServer();
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
      // ignore
    }
  });

  it('creates a guest, records events, and migrates data on signup', async () => {
    const GuestModel = require('../../dist/models/guest').default;
    const EventLogModel = require('../../dist/models/event-log').default;
    const UserModel = require('../../dist/models/user').default;
    const ItemModel = require('../../dist/models/item').default;

    // create guest via API
    const guestResp = await request(app).post('/v1/guests').send({}).expect(200);
    expect(guestResp.body.guestId).toBeDefined();
    const guestId = guestResp.body.guestId;

    // create an item and add to guest inventory directly
  const item = await ItemModel.create({ category: 'consumable', name: `itest-${Date.now()}`, price: 10, isActive: true });
    await GuestModel.updateOne({ guestId }, { $push: { inventory: item._id } }).exec();

    const eventType = `g_event_${Date.now()}`;

    // post two events as guest using X-Guest-Id header
    await request(app).post('/v1/events').set('X-Guest-Id', guestId).send({ eventType, payload: { score: 10 } }).expect(202);
    await request(app).post('/v1/events').set('X-Guest-Id', guestId).send({ eventType, payload: { score: 20 } }).expect(202);

    // ensure events stored with sessionId
    const guestEvents = await EventLogModel.find({ sessionId: guestId, eventType }).exec();
    expect(guestEvents.length).toBeGreaterThanOrEqual(2);

    // signup and request migration
    const email = `guesttest+${Date.now()}@example.com`;
    const displayName = `guestuser${Date.now()}`;
    const signupResp = await request(app)
      .post('/v1/auth/signup')
      .send({ email, displayName, password: 'password123', guestId })
      .expect(200);

    expect(signupResp.body.accessToken).toBeDefined();
    const userId = signupResp.body.user.id;

    // migrated events should now be associated with playerId and no sessionId
    const migrated = await EventLogModel.find({ playerId: userId, eventType }).exec();
    expect(migrated.length).toBeGreaterThanOrEqual(2);
    for (const m of migrated) {
      expect(m.playerId.toString()).toBe(userId.toString());
      expect(m.sessionId).toBeFalsy();
    }

    // guest record should be removed
    const guestAfter = await GuestModel.findOne({ guestId }).exec();
    expect(guestAfter).toBeNull();

    // user should have inventory containing the item (allow short retry loop)
    let user = null;
    let invIds = [];
    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      user = await UserModel.findById(userId).exec();
      invIds = (user?.inventory || []).map((i) => i.toString());
      if (invIds.includes(item._id.toString())) break;
      // wait a short time before retrying
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 300));
    }
    expect(user).toBeTruthy();
    expect(invIds).toContain(item._id.toString());
  }, 20000);
});
