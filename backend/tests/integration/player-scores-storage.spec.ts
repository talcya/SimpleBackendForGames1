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

describe('Player-scores and User-storage (auth + validation)', () => {
  it('should upsert a player score and allow owner-only user-storage access', async () => {
    const emailA = `userA+${Date.now()}@example.com`;
    const displayNameA = `userA-${Date.now()}`;
    const signupA = await request(app)
      .post('/v1/auth/signup')
      .send({ email: emailA, displayName: displayNameA, password: 'password123' })
      .expect(200);
    const accessA = signupA.body.accessToken;
    const userAId = signupA.body.user.id;
    expect(accessA).toBeDefined();

    // upsert score as authenticated user A
    const scoreResp = await request(app)
      .post('/v1/player-scores')
      .set('Authorization', `Bearer ${accessA}`)
      .send({ gameId: 'test-game', score: 1234 })
      .expect(200);
    expect(scoreResp.body.ok).toBe(true);

    // put user-storage entry as owner
    const key = 'settings';
    const payload = { data: { theme: 'dark' }, meta: { version: 1 } };
    const putResp = await request(app)
      .put(`/v1/user-storage/${userAId}/${key}`)
      .set('Authorization', `Bearer ${accessA}`)
      .send(payload)
      .expect(200);
    expect(putResp.body.data).toBeDefined();
    expect(putResp.body.data.theme).toBe('dark');

    // get user-storage as owner
    const getResp = await request(app)
      .get(`/v1/user-storage/${userAId}/${key}`)
      .set('Authorization', `Bearer ${accessA}`)
      .expect(200);
    expect(getResp.body.data.theme).toBe('dark');

    // signup a second user and ensure they cannot access userA storage
    const emailB = `userB+${Date.now()}@example.com`;
    const displayNameB = `userB-${Date.now()}`;
    const signupB = await request(app)
      .post('/v1/auth/signup')
      .send({ email: emailB, displayName: displayNameB, password: 'password123' })
      .expect(200);
    const accessB = signupB.body.accessToken;
    const forbidden = await request(app)
      .get(`/v1/user-storage/${userAId}/${key}`)
      .set('Authorization', `Bearer ${accessB}`)
      .expect(403);
    expect(forbidden.body.message).toBeDefined();
  }, 20000);
});
