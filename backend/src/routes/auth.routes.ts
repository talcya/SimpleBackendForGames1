import express from 'express';
// no explicit Request import needed here
import { signup, loginWithPassword, issueTokenForUser, verifyRefreshToken } from '../services/auth.service';
import { isAuthUser } from '../utils/auth-guards';
import UserModel from '../models/user';
import { randomBytes } from 'node:crypto';
import { requireAuth } from '../middleware/auth';
import passport from '../config/passport';
import { config } from '../config/index';

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { email, displayName, password, guestId } = req.body;
    const { user, accessToken, refreshToken } = await signup(email, displayName, password, guestId);
    res.json({ user: { id: user._id, displayName: user.displayName, email: user.email }, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await loginWithPassword(email, password);
    res.json({ user: { id: user._id, displayName: user.displayName, email: user.email }, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'missing refreshToken' });
  const payload = verifyRefreshToken(refreshToken);
    if (!payload) return res.status(401).json({ message: 'invalid refresh token' });
  const user = await UserModel.findById(payload.sub).exec();
    if (!user) return res.status(404).json({ message: 'user not found' });
    if (user.jwtVersion !== payload.v) return res.status(401).json({ message: 'token revoked' });
    // verify refresh token id (rid) to support rotation
    if (!payload.rid || user.refreshTokenId !== payload.rid) return res.status(401).json({ message: 'refresh token revoked' });
    // rotate refresh token id to prevent reuse
  user.refreshTokenId = randomBytes(16).toString('hex');
    await user.save();
  const tokens = issueTokenForUser(user);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'missing userId' });
  const user = await UserModel.findById(userId).exec();
    if (!user) return res.status(404).json({ message: 'user not found' });
    user.jwtVersion = (user.jwtVersion || 0) + 1;
    // also rotate refreshTokenId to immediately invalidate existing refresh tokens
  user.refreshTokenId = randomBytes(16).toString('hex');
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// protected endpoint to return current user info
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const UserModel = require('../models/user').default;
    if (!isAuthUser(req.user)) return res.status(401).json({ message: 'Unauthorized' });
    const user = await UserModel.findById(req.user.id).exec();
    if (!user) return res.status(404).json({ message: 'user not found' });
    res.json({ id: user._id, displayName: user.displayName, email: user.email });
  } catch (err) {
    next(err);
  }
});

// Passport Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/v1/auth/google/failure' }),
  async (req, res) => {
    // issue tokens and redirect to frontend with tokens
    // `req.user` is set by Passport; use the `isAuthUser` guard to narrow it.
    if (!isAuthUser(req.user)) return res.status(400).json({ message: 'invalid oauth user' });
    const user = await UserModel.findById(req.user.id).exec();
    if (!user) return res.status(404).json({ message: 'user not found' });
    const tokens = issueTokenForUser(user);
    const redirectUrl = `${config.frontendUrl}/auth/success?accessToken=${encodeURIComponent(tokens.accessToken)}&refreshToken=${encodeURIComponent(
      tokens.refreshToken
    )}`;
    res.redirect(redirectUrl);
  }
);

router.get('/google/failure', (req, res) => res.status(401).json({ message: 'google auth failed' }));

export default router;
