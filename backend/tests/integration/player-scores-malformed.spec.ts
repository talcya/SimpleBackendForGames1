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

describe('Player-scores malformed/negative cases', () => {
  it('rejects unauthenticated requests', async () => {
    await request(app).post('/v1/player-scores').send({ gameId: 'g', score: 10 }).expect(401);
  });

  it('rejects missing score field', async () => {
    const email = `neg+${Date.now()}@example.com`;
    const displayName = `neg-${Date.now()}`;
    const signup = await request(app)
      .post('/v1/auth/signup')
      .send({ email, displayName, password: 'password123' })
      .expect(200);
    const token = signup.body.accessToken;

    await request(app).post('/v1/player-scores').set('Authorization', `Bearer ${token}`).send({ gameId: 'g' }).expect(400);
  });

  it('rejects non-numeric score', async () => {
    const email = `neg2+${Date.now()}@example.com`;
    const displayName = `neg2-${Date.now()}`;
    const signup = await request(app)
      .post('/v1/auth/signup')
      .send({ email, displayName, password: 'password123' })
      .expect(200);
    const token = signup.body.accessToken;

    await request(app)
      .post('/v1/player-scores')
      .set('Authorization', `Bearer ${token}`)
      .send({ gameId: 'g', score: 'not-a-number' })
      .expect(400);
  });

  it('rejects too many fields or unknown properties (strict schema)', async () => {
    const email = `neg3+${Date.now()}@example.com`;
    const displayName = `neg3-${Date.now()}`;
    const signup = await request(app)
      .post('/v1/auth/signup')
      .send({ email, displayName, password: 'password123' })
      .expect(200);
    const token = signup.body.accessToken;

    // include an unexpected property
    await request(app)
      .post('/v1/player-scores')
      .set('Authorization', `Bearer ${token}`)
      .send({ gameId: 'g', score: 1, extra: { should: 'fail' } })
      .expect(400);
  });
});
