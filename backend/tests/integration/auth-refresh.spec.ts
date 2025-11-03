export {};
import request from 'supertest';
const { createServer } = require('../../dist/app');
import jwt from 'jsonwebtoken';
const { config } = require('../../dist/config/index');

let app: any;
let serverInstance: any;

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
    console.warn('mongoose disconnect failed in test cleanup:', (e as any) && (e as any).message ? (e as any).message : e);
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
    const verified = jwt.verify(refreshResp.body.accessToken, (config && config.jwtSecret) as string);
    expect(verified).toBeTruthy();

    // reusing the same refresh token should fail because server rotates refreshTokenId
    await request(app).post('/v1/auth/refresh').send({ refreshToken }).expect(401);
  });
});
