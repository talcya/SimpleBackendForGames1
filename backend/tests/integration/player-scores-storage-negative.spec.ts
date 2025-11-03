export {};
const request = require('supertest');
const { createServer } = require('../../src/app');

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

describe('Negative cases: player-scores and user-storage', () => {
  it('rejects unauthenticated score submission', async () => {
    await request(app).post('/v1/player-scores').send({ gameId: 'g', score: 10 }).expect(401);
  });

  it('rejects non-numeric or missing score for authenticated user', async () => {
    const email = `negA+${Date.now()}@example.com`;
  const signup = await request(app).post('/v1/auth/signup').send({ email, displayName: `negA-${Date.now()}`, password: 'password123' }).expect(200);
    const token = signup.body.accessToken;
    // missing score
    await request(app).post('/v1/player-scores').set('Authorization', `Bearer ${token}`).send({ gameId: 'g' }).expect(400);
    // non-numeric
    await request(app).post('/v1/player-scores').set('Authorization', `Bearer ${token}`).send({ gameId: 'g', score: 'not-a-number' }).expect(400);
  });

  it('requires auth for user-storage endpoints and validates payload', async () => {
    const email = `negB+${Date.now()}@example.com`;
  const signup = await request(app).post('/v1/auth/signup').send({ email, displayName: `negB-${Date.now()}`, password: 'password123' }).expect(200);
    const token = signup.body.accessToken;
    const userId = signup.body.user.id;

    // unauthenticated GET -> 401
    await request(app).get(`/v1/user-storage/${userId}/settings`).expect(401);

    // malformed PUT (missing data object) -> 400
    await request(app)
      .put(`/v1/user-storage/${userId}/settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ meta: { version: 1 } })
      .expect(400);
  });

  it('prevents other users from accessing owner-only storage', async () => {
    const emailA = `owner+${Date.now()}@example.com`;
  const sA = await request(app).post('/v1/auth/signup').send({ email: emailA, displayName: `owner-${Date.now()}`, password: 'password123' }).expect(200);
    const tokenA = sA.body.accessToken;
    const userAId = sA.body.user.id;

    const emailB = `intruder+${Date.now()}@example.com`;
  const sB = await request(app).post('/v1/auth/signup').send({ email: emailB, displayName: `intruder-${Date.now()}`, password: 'password123' }).expect(200);
    const tokenB = sB.body.accessToken;

    // owner creates entry
    await request(app)
      .put(`/v1/user-storage/${userAId}/prefs`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ data: { x: 1 } })
      .expect(200);

    // intruder tries to read -> 403
    await request(app).get(`/v1/user-storage/${userAId}/prefs`).set('Authorization', `Bearer ${tokenB}`).expect(403);

    // intruder tries to write -> 403
    await request(app)
      .put(`/v1/user-storage/${userAId}/prefs`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ data: { x: 2 } })
      .expect(403);
  });
});
