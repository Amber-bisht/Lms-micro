import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as oauthController from '../controllers/oauth.controller';
import * as profileController from '../controllers/profile.controller';

const router = Router();

// ============== PUBLIC ROUTES ==============
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/validate-token', authController.validateToken);
router.post('/admin-login-google', authController.adminLoginWithGoogle);

// ============== OAUTH ROUTES ==============
// OAuth initiation routes
import passport from '../config/passport';

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// router.get('/github', passport.authenticate('github', {
//   scope: ['user:email']
// }));

// OAuth callbacks (handled by Passport middleware)
router.get('/oauth/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/oauth/error' }),
  oauthController.googleCallback
);

// router.get('/oauth/github/callback',
//   passport.authenticate('github', { failureRedirect: '/api/auth/oauth/error' }),
//   oauthController.githubCallback
// );

router.get('/oauth/success', oauthController.oauthSuccess);
router.get('/oauth/error', oauthController.oauthError);

// ============== PROTECTED ROUTES (require token) ==============
router.get('/me', authController.getCurrentUser);
router.get('/user/enrollments', authController.getCurrentUserEnrollments);
router.put('/profile', authController.updateProfile);

// Profile management
router.get('/profile', profileController.getProfile);
router.put('/profile/update', profileController.createOrUpdateProfile);
router.delete('/account', profileController.deleteAccount);
router.get('/profile/user/enrollments', authController.getCurrentUserEnrollments);

// ============== USER PROFILE ROUTES ==============
router.get('/users/:id/profile', authController.getUserProfile);
router.get('/users/username/:username', authController.getUserProfileByUsername);
router.get('/users/:id/enrollments', authController.getUserEnrollments);
router.get('/users/:id/activity', authController.getUserActivity);

// ============== ADMIN ROUTES ==============
router.get('/users', authController.getAllUsers);
router.put('/users/:id/ban', authController.banUser);
router.get('/blocked-ips', authController.getBlockedIPs);
router.delete('/blocked-ips/:ipAddress', authController.deleteBlockedIP);
router.get('/rate-limits', authController.getRateLimits);
router.get('/permanent-bans', authController.getPermanentBans);
router.post('/ban-ip', authController.banIP);
router.post('/ban-user', authController.banUser);
router.delete('/unban-ip/:target', authController.unbanIP);
router.delete('/unban-user/:target', authController.unbanUser);

export default router;
