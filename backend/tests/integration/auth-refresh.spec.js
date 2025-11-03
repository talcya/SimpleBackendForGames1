const request = require('supertest');
const { createServer } = require('../../dist/app');
const jwt = require('jsonwebtoken');
const { config } = require('../../dist/config/index');

let app;
let serverInstance;

beforeAll(async () => {
  const created = await createServer();
  app = created.app;
  serverInstance = created.server;
});

afterAll(async () => {
  if (serverInstance && typeof serverInstance.close === 'function') await new Promise((res) => serverInstance.close(() => res(null)));
  try {
    const mongoose = require('mongoose');
    if (mongoose && mongoose.disconnect) await mongoose.disconnect();
  } catch (e) {
    // log cleanup problems so linter considers the exception handled
    // eslint-disable-next-line no-console
    console.warn('mongoose disconnect failed in test cleanup:', e && e.message ? e.message : e);
  }
});

describe('Auth refresh flow', () => {
  it('signup -> refresh tokens and prevent reuse (rotation)', async () => {
    const email = `rtest+${Date.now()}@example.com`;
    const displayName = `rtester${Date.now()}`;
    const signup = await request(app).post('/v1/auth/signup').send({ email, displayName, password: 'password123' }).expect(200);
    const refreshToken = signup.body.refreshToken;
    expect(refreshToken).toBeDefined();

    // first refresh should succeed
    const refreshResp = await request(app).post('/v1/auth/refresh').send({ refreshToken }).expect(200);
    expect(refreshResp.body.accessToken).toBeDefined();
    // verify access token is valid and signed with server secret
    const verified = jwt.verify(refreshResp.body.accessToken, config.jwtSecret);
    expect(verified).toBeTruthy();

    // reusing the same refresh token should fail because server rotates refreshTokenId
    await request(app).post('/v1/auth/refresh').send({ refreshToken }).expect(401);
  });
});
