export {};
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
  // close server and mongoose connection
  if (serverInstance && typeof serverInstance.close === 'function') {
    await new Promise((res) => serverInstance.close(() => res(null)));
  }
});

describe('Player progress integration', () => {
  it('should signup and login and submit score', async () => {
    const email = `test+${Date.now()}@example.com`;
  const displayName = `tester${Date.now()}`;
  const signupResp = await request(app).post('/v1/auth/signup').send({ email, displayName, password: 'password123' }).expect(200);
  expect(signupResp.body.accessToken).toBeDefined();
    const userId = signupResp.body.user.id;

    const loginResp = await request(app).post('/v1/auth/login').send({ email, password: 'password123' }).expect(200);
  expect(loginResp.body.accessToken).toBeDefined();

    const scoreResp = await request(app).post(`/v1/players/${userId}/score`).send({ score: 12345 }).expect(200);
    expect(scoreResp.body.ok).toBe(true);
    expect(scoreResp.body.score).toBeGreaterThanOrEqual(12345);
  }, 20000);
});
