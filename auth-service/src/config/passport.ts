import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User';
import { logger } from '../utils/logger';
import config from './config';
import { generateUniqueUsername } from '../utils/username-generator';

// Serialize user to session
passport.serializeUser((user: any, done) => {
  logger.info(`Serializing user: ${user._id}`);
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    logger.info(`Deserializing user: ${id}`);
    const user = await User.findById(id);
    if (!user) {
      logger.error(`User not found during deserialization: ${id}`);
      done(null, false);
      return;
    }
    logger.info(`User deserialized successfully: ${user.username}`);
    done(null, user);
  } catch (error) {
    logger.error(`Deserialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    done(error, null);
  }
});

// Google OAuth Strategy
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/oauth/google/callback',
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          logger.info(`Google OAuth - Processing profile: ${profile.id}`);
          
          const email = profile.emails?.[0]?.value;
          if (!email) {
            logger.error('Google OAuth - No email found in profile');
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Check if user exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            logger.info(`Google OAuth - Existing user found: ${user.username}`);
            return done(null, user);
          }

          // Check if user exists with this email
          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing user
            logger.info(`Google OAuth - Linking Google account to existing user: ${user.username}`);
            user.googleId = profile.id;
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }

          // Create new user
          const username = await generateUniqueUsername(profile.displayName || email.split('@')[0]);
          const fullName = profile.displayName || username;
          
          logger.info(`Google OAuth - Creating new user: ${username}`);
          
          user = await User.create({
            email,
            username,
            fullName,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || '',
            isAdmin: false,
            isBanned: false,
            hasCompletedProfile: false,
            provider: 'google',
          });

          logger.info(`Google OAuth - New user created: ${user.username} (${user._id})`);
          return done(null, user);
        } catch (error) {
          logger.error(`Google OAuth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return done(error as Error, undefined);
        }
      }
    )
  );
  logger.info('Google OAuth strategy configured');
} else {
  logger.warn('Google OAuth not configured - missing client ID or secret');
}

// GitHub OAuth Strategy - COMMENTED OUT
// if (config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET) {
//   passport.use(
//     new GitHubStrategy(
//       {
//         clientID: config.GITHUB_CLIENT_ID,
//         clientSecret: config.GITHUB_CLIENT_SECRET,
//         callbackURL: config.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/oauth/github/callback',
//         scope: ['user:email'],
//       },
//       async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
//         try {
//           logger.info(`GitHub OAuth - Processing profile: ${profile.id}`);
//           
//           const email = profile.emails?.[0]?.value;
//           if (!email) {
//             logger.error('GitHub OAuth - No email found in profile');
//             return done(new Error('No email found in GitHub profile'), undefined);
//           }

//           // Check if user exists with this GitHub ID
//           let user = await User.findOne({ githubId: profile.id });

//           if (user) {
//             logger.info(`GitHub OAuth - Existing user found: ${user.username}`);
//             return done(null, user);
//           }

//           // Check if user exists with this email
//           user = await User.findOne({ email });

//           if (user) {
//             // Link GitHub account to existing user
//             logger.info(`GitHub OAuth - Linking GitHub account to existing user: ${user.username}`);
//             user.githubId = profile.id;
//             if (!user.avatar && profile.photos?.[0]?.value) {
//               user.avatar = profile.photos[0].value;
//             }
//             await user.save();
//             return done(null, user);
//           }

//           // Create new user
//           const username = await generateUsername(profile.username || profile.displayName || email.split('@')[0]);
//           const fullName = profile.displayName || username;
//           
//           logger.info(`GitHub OAuth - Creating new user: ${username}`);
//           
//           user = await User.create({
//             email,
//             username,
//             fullName,
//             githubId: profile.id,
//             avatar: profile.photos?.[0]?.value || '',
//             isAdmin: false,
//             isBanned: false,
//             hasCompletedProfile: false,
//             provider: 'github',
//           });

//           logger.info(`GitHub OAuth - New user created: ${user.username} (${user._id})`);
//           return done(null, user);
//         } catch (error) {
//           logger.error(`GitHub OAuth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
//           return done(error as Error, undefined);
//         }
//       }
//     )
//   );
//   logger.info('GitHub OAuth strategy configured');
// } else {
//   logger.warn('GitHub OAuth not configured - missing client ID or secret');
// }
logger.warn('GitHub OAuth disabled');

export default passport;

