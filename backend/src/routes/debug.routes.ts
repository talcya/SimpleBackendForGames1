import express from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/user';
import { config } from '../config';

const router = express.Router();

// GET /v1/debug/token?email=... or ?id=...
// Dev-only: returns a signed JWT for the requested user (if found).
router.get('/token', async (req, res, next) => {
  try {
    const { email, id } = req.query as any;
    if (!email && !id) return res.status(400).json({ message: 'provide email or id' });
    let user = null;
    if (email) user = await UserModel.findOne({ email }).exec();
    if (!user && id) user = await UserModel.findById(id).exec();
    if (!user) return res.status(404).json({ message: 'user not found' });

    const payload = { id: user._id.toString(), v: user.jwtVersion, role: user.role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
    res.json({ token, payload });
  } catch (err) {
    next(err);
  }
});

// GET /v1/debug/launch?email=... or ?id=...
// Dev-only: create a JWT and return an HTML page that stores it in localStorage
// then redirects the browser to the Swagger UI so the token is pre-applied.
router.get('/launch', async (req, res, next) => {
  try {
    const { email, id } = req.query as any;
    if (!email && !id) return res.status(400).send('provide email or id');
    let user = null;
    if (email) user = await UserModel.findOne({ email }).exec();
    if (!user && id) user = await UserModel.findById(id).exec();
    if (!user) return res.status(404).send('user not found');

    const payload = { id: user._id.toString(), v: user.jwtVersion, role: user.role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Launching Swagger</title></head><body>
<script>
  try { localStorage.setItem('dev_bearer_token', ${JSON.stringify(token)}); } catch(e) { /* ignore */ }
  // small delay to ensure storage settled in some browsers
  setTimeout(function(){ window.location.href = '/docs/swagger.html'; }, 200);
</script>
<p>Launching Swagger UI with token for ${user.displayName}... If you are not redirected, <a href="/docs/swagger.html">open Swagger UI</a>.</p>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

export default router;
