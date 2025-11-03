export {};
import request from 'supertest';
const { createServer } = require('../../dist/app');

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
    // eslint-disable-next-line no-console
    console.warn('mongoose disconnect failed in test cleanup:', (e as any) && (e as any).message ? (e as any).message : e);
  }
});

describe('Logout and revocation', () => {
  it('logout should revoke access and refresh tokens', async () => {
    const email = `ltest+${Date.now()}@example.com`;
    const displayName = `ltester${Date.now()}`;
    const signup = await request(app).post('/v1/auth/signup').send({ email, displayName, password: 'password123' }).expect(200);
    const { accessToken, refreshToken, user } = signup.body;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // logout
    await request(app).post('/v1/auth/logout').send({ userId: user.id }).expect(200);

    // access to /v1/auth/me using old access token should be unauthorized
    await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(401);

    // using old refresh token should also be rejected
    await request(app).post('/v1/auth/refresh').send({ refreshToken }).expect(401);
  });
});
