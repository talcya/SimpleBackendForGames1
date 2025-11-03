export {};
import request from 'supertest';
import express from 'express';
import adminRoutes from '../../src/routes/admin.routes';

describe('admin routes (integration)', () => {
  let app: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  test('non-admin user is forbidden from admin health endpoint', async () => {
    // inject a non-admin user
    app.use((req: any, res: any, next: any) => {
      req.user = { id: 'u1', role: 'user' };
      next();
    });
    app.use('/v1/admin', adminRoutes);

    const res = await request(app).get('/v1/admin/health');
    expect(res.status).toBe(403);
  });

  test('admin user can access admin health endpoint', async () => {
    app.use((req: any, res: any, next: any) => {
      req.user = { id: 'u2', role: 'admin' };
      next();
    });
    app.use('/v1/admin', adminRoutes);

    const res = await request(app).get('/v1/admin/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });
});
