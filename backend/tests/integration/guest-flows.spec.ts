export {};
import request from 'supertest';

// Integration tests for guest flows: create guest, post guest events, migrate on signup
describe('Guest flows integration', () => {
  let app: any;
  let serverInstance: any;

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

    // Attach a one-time listener for the explicit migration event emitted by the server
    const migrationPromise = new Promise<{ userId: string; guestId?: string } | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 5000);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      (process as any).once('guest:migrated', (payload: any) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    const signupResp = await request(app)
      .post('/v1/auth/signup')
      .send({ email, displayName, password: 'password123', guestId })
      .expect(200);

    expect(signupResp.body.accessToken).toBeDefined();
    const userId = signupResp.body.user.id;

    // Wait for the server-emitted migration signal (should have fired during signup)
    const migratedPayload = await migrationPromise;
    if (migratedPayload) {
      expect(migratedPayload.userId).toBeDefined();
      expect(migratedPayload.userId).toBe(userId.toString());
    }

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

    // user should have inventory containing the item (direct check now that migration signaled completion)
    const user = await UserModel.findById(userId).exec();
    expect(user).toBeTruthy();
    const invIds = (user?.inventory || []).map((i: any) => i.toString());
    expect(invIds).toContain(item._id.toString());
  }, 20000);
});
