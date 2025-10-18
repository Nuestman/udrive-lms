// Authentication Routes
import express from 'express';
import authService from '../services/auth.service.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login({ email, password });

    // Set token in HTTP-only cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/auth/signup
 * Register new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, tenant_id, subdomain, role } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ 
        error: 'Email, password, first name, and last name are required' 
      });
    }

    if (!tenant_id && !subdomain) {
      return res.status(400).json({ 
        error: 'Either tenant ID or subdomain is required' 
      });
    }

    const result = await authService.signup({
      email,
      password,
      first_name,
      last_name,
      phone,
      tenant_id,
      subdomain,
      role
    });

    // Set token in HTTP-only cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current user from token
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await authService.verifyToken(token);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', async (req, res) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await authService.verifyToken(token);
    const updates = req.body;

    const updatedUser = await authService.updateProfile(currentUser.id, updates);
    res.json({ success: true, user: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', async (req, res) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUser = await authService.verifyToken(token);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    await authService.changePassword(currentUser.id, currentPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const resetToken = await authService.requestPasswordReset(email);
    
    // In production, send email with reset link
    // For now, return token for testing
    res.json({ 
      success: true, 
      message: 'Password reset instructions sent to email',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    await authService.resetPassword(token, newPassword);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/signup/school
 * School creation signup - Create new school + first admin
 */
router.post('/signup/school', async (req, res) => {
  try {
    const { school_name, subdomain, contact_email, contact_phone, address, ...userData } = req.body;
    const schoolData = { school_name, subdomain, contact_email, contact_phone, address };
    const result = await authService.signupWithSchool(userData, schoolData);
    
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      user: result.user,
      school: result.school,
      token: result.token,
      message: 'School and account created successfully'
    });
  } catch (error) {
    console.error('School signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/signup/super-admin
 * Super admin signup - Only if no super admin exists
 */
router.post('/signup/super-admin', async (req, res) => {
  try {
    const result = await authService.signupSuperAdmin(req.body);
    
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token,
      message: 'Super admin created successfully'
    });
  } catch (error) {
    console.error('Super admin signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;

