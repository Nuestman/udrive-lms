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
    const { email, password, twoFactorToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login({ email, password, twoFactorToken });

    // If 2FA is required, return that instead of proceeding
    if (result.requires2FA) {
      return res.json({
        success: false,
        requires2FA: true,
        message: result.message,
        userId: result.userId
      });
    }

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
    res.json({ success: true, user, token });
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
 * POST /api/auth/verify-2fa
 * Verify 2FA token during login
 */
router.post('/verify-2fa', async (req, res) => {
  try {
    const { userId, twoFactorToken } = req.body;

    if (!userId || !twoFactorToken) {
      return res.status(400).json({ error: 'User ID and 2FA token are required' });
    }

    // Verify 2FA token
    const twoFactorAuthService = (await import('../services/twoFactorAuth.service.js')).default;
    await twoFactorAuthService.verifyToken(userId, twoFactorToken);

    // Get user data directly
    const { query } = await import('../lib/db.js');
    const result = await query(
      `SELECT 
         u.id, u.tenant_id, u.email, u.role, u.settings, u.is_active, u.last_login,
         u.created_at, u.updated_at,
         p.first_name, p.last_name, p.avatar_url, p.phone, p.bio, p.date_of_birth,
         p.address_line1, p.address_line2, p.city, p.state_province, p.postal_code, p.country,
         p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_email, p.emergency_contact_relationship,
         p.guardian_name, p.guardian_email, p.guardian_phone, p.guardian_relationship, p.guardian_address,
         p.nationality, p.preferred_language, p.timezone, p.profile_preferences,
         p.linkedin_url, p.twitter_url, p.website_url
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found or inactive');
    }

    const user = result.rows[0];
    
    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
    
    // Generate JWT token
    const jwt = (await import('jsonwebtoken')).default;
    const { APP_CONFIG } = await import('../config/app.js');
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        tenant_id: user.tenant_id
      },
      APP_CONFIG.JWT_SECRET,
      { expiresIn: APP_CONFIG.JWT_EXPIRES_IN }
    );

    // Set token in HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      user: user,
      token: token
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(401).json({ error: error.message });
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

