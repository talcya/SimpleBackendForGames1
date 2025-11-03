import { Router } from 'express';
import { requireRole } from '../middleware/roles';
import { Role } from '../models/user';

// Small admin-only route collection demonstrating how to wire role middleware.
// This file is intentionally standalone — you can mount it in your app as:
//   import adminRoutes from './routes/admin.routes';
//   app.use('/v1/admin', adminRoutes);

const router = Router();

// Example: simple health endpoint only accessible to admins
router.get('/health', requireRole('admin' as Role), (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

export default router;
