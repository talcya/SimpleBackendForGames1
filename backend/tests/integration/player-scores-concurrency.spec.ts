export {};
/// <reference types="jest" />
import request from 'supertest';
import { createServer } from '../../src/app';

let app: any;
let serverInstance: any;

beforeAll(async () => {
  const created = await createServer();
  app = created.app;
  serverInstance = created.server;
});

afterAll(async () => {
  if (serverInstance && typeof serverInstance.close === 'function') {
    await new Promise((res) => serverInstance.close(() => res(null)));
  }
});

describe('Player-scores concurrent activity dedupe', () => {
  it('creates only one high_score PlayerActivity for many concurrent same-score submissions', async () => {
    const email = `concurrent-activity+${Date.now()}@example.com`;
    const displayName = `concurrent-activity-${Date.now()}`;
    const signup = await request(app)
      .post('/v1/auth/signup')
      .send({ email, displayName, password: 'password123' })
      .expect(200);
    const token = signup.body.accessToken;
    const userId = signup.body.user.id;

    const score = 424242;
    const concurrent = 30;

    const promises = [] as Promise<any>[];
    for (let i = 0; i < concurrent; i++) {
      promises.push(
        request(app)
          .post('/v1/player-scores')
          .set('Authorization', `Bearer ${token}`)
          .send({ gameId: 'concurrency-game', score })
      );
    }

    const results = await Promise.all(promises);
    // ensure at least one request succeeded
    const okCount = results.filter((r) => r.status === 200).length;
    expect(okCount).toBeGreaterThan(0);

    // Poll the activities collection for a short window (robust against timing)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PlayerActivityModel = require('../../src/models/player-activity').default;
  const maxMs = process.env.CONCURRENCY_POLL_MS ? Number(process.env.CONCURRENCY_POLL_MS) : 3000;
  const pollInterval = process.env.CONCURRENCY_POLL_INTERVAL_MS ? Number(process.env.CONCURRENCY_POLL_INTERVAL_MS) : 100;
    const start = Date.now();
    let activities: any[] = [];
    while (Date.now() - start < maxMs) {
      // eslint-disable-next-line no-await-in-loop
      activities = await PlayerActivityModel.find({ player: userId, type: 'high_score', 'details.newScore': score }).lean().exec();
      if (activities.length > 0) break;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    // Only one activity should be created within the dedupe window
    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBe(1);
  }, 20000);

  it('creates only one high_score PlayerActivity for many concurrent different-score submissions', async () => {
    const email = `concurrent-diff+${Date.now()}@example.com`;
    const displayName = `concurrent-diff-${Date.now()}`;
    const signup = await request(app)
      .post('/v1/auth/signup')
      .send({ email, displayName, password: 'password123' })
      .expect(200);
    const token = signup.body.accessToken;
    const userId = signup.body.user.id;

    const scores = [10, 200, 50, 999, 3, 500, 42, 777];
    const promises = scores.map((s) =>
      request(app).post('/v1/player-scores').set('Authorization', `Bearer ${token}`).send({ gameId: 'concurrency-game', score: s })
    );

    const results = await Promise.all(promises);
    const okCount = results.filter((r) => r.status === 200).length;
    expect(okCount).toBeGreaterThan(0);

    // Poll for any activity with one of the scores
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PlayerActivityModel = require('../../src/models/player-activity').default;
    const maxMs2 = process.env.CONCURRENCY_POLL_MS ? Number(process.env.CONCURRENCY_POLL_MS) : 3000;
    const pollInterval2 = process.env.CONCURRENCY_POLL_INTERVAL_MS ? Number(process.env.CONCURRENCY_POLL_INTERVAL_MS) : 100;
    const start2 = Date.now();
    let activities: any[] = [];
    while (Date.now() - start2 < maxMs2) {
      // eslint-disable-next-line no-await-in-loop
      activities = await PlayerActivityModel.find({ player: userId, type: 'high_score', 'details.newScore': { $in: scores } }).lean().exec();
      if (activities.length > 0) break;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, pollInterval2));
    }

    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBe(1);
  }, 20000);
});
