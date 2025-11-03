import passport from 'passport';
import { Strategy as GoogleStrategy, StrategyOptionsWithRequest } from 'passport-google-oauth20';
import type { VerifyCallback } from 'passport-google-oauth20';
import type { Request as ExpressRequest } from 'express';
import type { Profile as PassportProfile } from 'passport';
import UserModel from '../models/user';
import { config } from './index';

passport.serializeUser((user, done) => {
  try {
    const u = user as Record<string, unknown>;
    const id = u && '_id' in u ? u['_id'] : user;
    done(null, id);
  } catch (error_) {
    done(error_);
  }
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id).exec();
    done(null, user);
  } catch (error_) {
    // Ensure we pass an Error to Passport's done callback without using `any`.
    if (error_ instanceof Error) {
      done(error_);
    } else {
      done(new Error(String(error_)));
    }
  }
});

// Google strategy (placeholder). Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env to function.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const options: StrategyOptionsWithRequest = {
    clientID: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackURL: `${config.frontendUrl}/auth/google/callback`,
    passReqToCallback: true,
  };

  const verify = async (
    req: ExpressRequest,
    accessToken: string,
    refreshToken: string,
    params: unknown,
    profile: PassportProfile,
    done: VerifyCallback
  ) => {
    try {
      const googleId = profile.id;
      const displayName =
        profile.displayName ?? (profile.name ? `${profile.name.givenName ?? ''} ${profile.name.familyName ?? ''}`.trim() : undefined);

      const existing = await UserModel.findOne({ googleId }).exec();
      if (existing) return done(null, existing);

      const user = new UserModel({ googleId, displayName });
      await user.save();
      return done(null, user);
    } catch (error_) {
      return done(error_);
    }
  };

  passport.use(new GoogleStrategy(options, verify));
} else {
  // noop - Google OAuth not configured in this environment
}

export default passport;
