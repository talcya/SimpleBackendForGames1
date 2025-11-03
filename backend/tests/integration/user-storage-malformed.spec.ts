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

describe('User-storage malformed/negative cases', () => {
  it('rejects unauthenticated PUT', async () => {
    const fakeUser = '000000000000000000000000';
    await request(app).put(`/v1/user-storage/${fakeUser}/k`).send({ data: { a: 1 } }).expect(401);
  });

  it('rejects missing data property', async () => {
    const email = `usneg+${Date.now()}@example.com`;
    const displayName = `usneg-${Date.now()}`;
    const signup = await request(app)
      .post('/v1/auth/signup')
      .send({ email, displayName, password: 'password123' })
      .expect(200);
    const token = signup.body.accessToken;
    const userId = signup.body.user.id;

    // body missing 'data'
    await request(app).put(`/v1/user-storage/${userId}/k`).set('Authorization', `Bearer ${token}`).send({}).expect(400);
  });

  it('rejects non-object data', async () => {
    const email = `usneg2+${Date.now()}@example.com`;
    const displayName = `usneg2-${Date.now()}`;
    const signup = await request(app)
      .post('/v1/auth/signup')
      .send({ email, displayName, password: 'password123' })
      .expect(200);
    const token = signup.body.accessToken;
    const userId = signup.body.user.id;

    await request(app).put(`/v1/user-storage/${userId}/k`).set('Authorization', `Bearer ${token}`).send({ data: 'not-an-object' }).expect(400);
  });
});
