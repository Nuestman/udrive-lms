// Authentication Service - Enhanced with tenant-aware signup
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../lib/db.js';
import { APP_CONFIG } from '../config/app.js';
import { sendPasswordResetEmail, isEmailConfigured } from '../utils/mailer.js';

/**
 * Normalize user data with active_role from settings
 * Sets active_role = role if not set in settings
 */
function normalizeUserData(user) {
  const settings = user.settings || {};
  const primaryRole = user.role;
  // Default active_role to primary role if not set
  const activeRole = settings.active_role || primaryRole;
  
  return {
    ...user,
    primary_role: primaryRole,
    active_role: activeRole,
    settings: {
      ...settings,
      active_role: activeRole
    }
  };
}

/**
 * Login user
 */
export async function login(credentials) {
  const { email, password, twoFactorToken } = credentials;
  
  // Get user with ALL profile data
  const result = await query(
    `SELECT 
       u.id, u.tenant_id, u.email, u.role, u.settings, u.is_active, u.last_login,
       u.created_at, u.updated_at, u.password_hash,
       p.first_name, p.last_name, p.avatar_url, p.phone, p.bio, p.date_of_birth,
       p.address_line1, p.address_line2, p.city, p.state_province, p.postal_code, p.country,
       p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_email, p.emergency_contact_relationship,
       p.guardian_name, p.guardian_email, p.guardian_phone, p.guardian_relationship, p.guardian_address,
       p.nationality, p.preferred_language, p.timezone, p.profile_preferences,
       p.linkedin_url, p.twitter_url, p.website_url
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.email = $1 AND u.is_active = true`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Check if 2FA is enabled
  const settings = user.settings || {};
  const is2FAEnabled = settings.two_factor_enabled;

  if (is2FAEnabled) {
    // If 2FA is enabled but no token provided, return 2FA required
    if (!twoFactorToken) {
      return { 
        requires2FA: true, 
        message: 'Two-factor authentication required',
        userId: user.id 
      };
    }

    // Verify 2FA token
    const twoFactorAuthService = (await import('./twoFactorAuth.service.js')).default;
    try {
      await twoFactorAuthService.verifyToken(user.id, twoFactorToken);
    } catch (error) {
      throw new Error('Invalid two-factor authentication code');
    }
  }

  // Update last login
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate JWT token
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

  // Remove password from response and normalize with active_role
  const { password_hash, ...userWithoutPassword } = user;
  const normalizedUser = normalizeUserData(userWithoutPassword);

  return { user: normalizedUser, token };
}

/**
 * Regular signup - Join existing school via subdomain or tenant_id
 */
export async function signup(userData) {
  const { email, password, first_name, last_name, phone, role, subdomain, tenant_id } = userData;

  // Support both subdomain and tenant_id (for backwards compatibility)
  let tenantIdToUse = tenant_id;

  // If subdomain provided, look up tenant_id
  if (subdomain) {
    const tenantResult = await query(
      'SELECT id, is_active FROM tenants WHERE subdomain = $1',
      [subdomain]
    );

    if (tenantResult.rows.length === 0) {
      throw new Error(`School "${subdomain}" not found. Please check the subdomain or contact your administrator.`);
    }

    if (!tenantResult.rows[0].is_active) {
      throw new Error('This school is currently inactive. Please contact support.');
    }

    tenantIdToUse = tenantResult.rows[0].id;
  }

  // Validate tenant_id exists
  if (!tenantIdToUse) {
    throw new Error('School information is required. Please provide subdomain or tenant ID.');
  }

  // Verify tenant exists
  const tenantCheck = await query(
    'SELECT id FROM tenants WHERE id = $1',
    [tenantIdToUse]
  );

  if (tenantCheck.rows.length === 0) {
    throw new Error('Invalid school ID');
  }

  // Check if email already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create user (auth table only)
  const userResult = await query(
    `INSERT INTO users (email, password_hash, tenant_id, role, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [email, password_hash, tenantIdToUse, role || 'student']
  );

  const user = userResult.rows[0];

  // Create profile
  await query(
    `INSERT INTO user_profiles (user_id, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4)`,
    [user.id, first_name, last_name, phone]
  );

  // Generate token
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

  const { password_hash: _, ...userWithoutPassword } = user;
  const userWithProfile = {
      ...userWithoutPassword,
      first_name,
      last_name,
      phone
  };
  const normalizedUser = normalizeUserData(userWithProfile);

  return { 
    user: normalizedUser,
    token 
  };
}

/**
 * School creation signup - Create new school + first admin user
 */
export async function signupWithSchool(userData, schoolData) {
  const { email, password, first_name, last_name, phone } = userData;
  const { school_name, subdomain, contact_email, contact_phone, address } = schoolData;

  // Validate school data
  if (!school_name || !subdomain) {
    throw new Error('School name and subdomain are required');
  }

  // Check if subdomain already exists
  const existingSchool = await query(
    'SELECT id FROM tenants WHERE subdomain = $1',
    [subdomain]
  );

  if (existingSchool.rows.length > 0) {
    throw new Error('Subdomain already in use. Please choose a different one.');
  }

  // Check if email already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Create tenant/school first
  const tenantResult = await query(
    `INSERT INTO tenants (name, subdomain, contact_email, contact_phone, address, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING *`,
    [school_name, subdomain, contact_email, contact_phone, address]
  );

  const tenant = tenantResult.rows[0];

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create school admin user (auth table only)
  const userResult = await query(
    `INSERT INTO users (email, password_hash, tenant_id, role, is_active)
     VALUES ($1, $2, $3, 'school_admin', true)
     RETURNING *`,
    [email, password_hash, tenant.id]
  );

  const user = userResult.rows[0];

  // Create profile
  await query(
    `INSERT INTO user_profiles (user_id, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4)`,
    [user.id, first_name, last_name, phone]
  );

  // Generate token
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

  const { password_hash: _, ...userWithoutPassword } = user;
  const userWithProfile = {
      ...userWithoutPassword,
      first_name,
      last_name,
      phone
  };
  const normalizedUser = normalizeUserData(userWithProfile);

  return { 
    user: normalizedUser,
    token,
    school: tenant
  };
}

/**
 * Super admin signup (restricted - only if no super admin exists)
 */
export async function signupSuperAdmin(userData) {
  // Check if super admin already exists
  const existingSuperAdmin = await query(
    "SELECT id FROM users WHERE role = 'super_admin' AND is_active = true"
  );

  if (existingSuperAdmin.rows.length > 0) {
    throw new Error('Super admin already exists. Contact system administrator.');
  }

  const { email, password, first_name, last_name } = userData;

  // Check if email exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create super admin (no tenant)
  const userResult = await query(
    `INSERT INTO users (email, password_hash, tenant_id, role, is_active)
     VALUES ($1, $2, NULL, 'super_admin', true)
     RETURNING *`,
    [email, password_hash]
  );

  const user = userResult.rows[0];

  // Create profile
  await query(
    `INSERT INTO user_profiles (user_id, first_name, last_name)
     VALUES ($1, $2, $3)`,
    [user.id, first_name, last_name]
  );

  // Generate token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      tenant_id: null
    },
    APP_CONFIG.JWT_SECRET,
    { expiresIn: APP_CONFIG.JWT_EXPIRES_IN }
  );

  const { password_hash: _, ...userWithoutPassword } = user;
  const userWithProfile = {
      ...userWithoutPassword,
      first_name,
      last_name
  };
  const normalizedUser = normalizeUserData(userWithProfile);

  return { 
    user: normalizedUser,
    token 
  };
}

/**
 * Verify JWT token
 */
export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, APP_CONFIG.JWT_SECRET);
    
    // Get fresh user data with ALL profile fields
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
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found or inactive');
    }

    const { password_hash, ...userWithoutPassword } = result.rows[0];
    return normalizeUserData(userWithoutPassword);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId, updates) {
  // Define allowed profile fields
  const profileFields = [
    'first_name', 'last_name', 'phone', 'avatar_url', 'bio', 'date_of_birth',
    'address_line1', 'address_line2', 'city', 'state_province', 'postal_code', 'country',
    'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_email', 'emergency_contact_relationship',
    'guardian_name', 'guardian_email', 'guardian_phone', 'guardian_relationship', 'guardian_address',
    'nationality', 'preferred_language', 'timezone', 'profile_preferences',
    'linkedin_url', 'twitter_url', 'website_url'
  ];

  // Build dynamic UPDATE query for profile fields only
  const updateFields = [];
  const values = [userId]; // $1 is userId
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    if (profileFields.includes(key)) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    throw new Error('No valid profile fields to update');
  }

  // Update profile table
  await query(
    `UPDATE user_profiles
     SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1`,
    values
  );

  // Return updated user with ALL profile fields
  const result = await query(
    `SELECT 
       u.id, u.tenant_id, u.email, u.role, u.settings, u.is_active, u.last_login,
       u.created_at as user_created_at, u.updated_at as user_updated_at,
       p.first_name, p.last_name, p.avatar_url, p.phone, p.bio, p.date_of_birth,
       p.address_line1, p.address_line2, p.city, p.state_province, p.postal_code, p.country,
       p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_email, p.emergency_contact_relationship,
       p.guardian_name, p.guardian_email, p.guardian_phone, p.guardian_relationship, p.guardian_address,
       p.nationality, p.preferred_language, p.timezone, p.profile_preferences,
       p.linkedin_url, p.twitter_url, p.website_url,
       p.created_at as profile_created_at, p.updated_at as profile_updated_at
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const { password_hash, user_created_at, profile_created_at, profile_updated_at, ...userWithProfile } = result.rows[0];
  
  // Use user table timestamps as primary
  userWithProfile.created_at = user_created_at;
  userWithProfile.updated_at = profile_updated_at || userWithProfile.user_updated_at;
  
  return normalizeUserData(userWithProfile);
}

/**
 * Change password
 */
export async function changePassword(userId, currentPassword, newPassword) {
  // Get user
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newPasswordHash, userId]
  );

  return { success: true };
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email) {
  // Check if user exists
  const result = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    // Don't reveal if email exists (security)
    return { success: true };
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { id: result.rows[0].id, purpose: 'reset_password' },
    APP_CONFIG.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Build reset URL for frontend
  const resetUrl = `${APP_CONFIG.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  // If SMTP configured, send the email (non-blocking failure)
  if (isEmailConfigured()) {
    try {
      await sendPasswordResetEmail({ to: email, resetUrl, appName: 'SunLMS' });
    } catch (err) {
      // Log but do not fail the request to avoid user enumeration signals
      console.error('Failed to send password reset email:', err?.message || err);
    }
  }

  // Return token in dev for convenience; in prod just success
  if (APP_CONFIG.NODE_ENV === 'development') {
    return resetToken;
  }
  return { success: true };
}

/**
 * Reset password with token
 */
export async function resetPassword(resetToken, newPassword) {
  try {
    const decoded = jwt.verify(resetToken, APP_CONFIG.JWT_SECRET);

    if (decoded.purpose !== 'reset_password') {
      throw new Error('Invalid reset token');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [password_hash, decoded.id]
    );

    return { success: true };
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
}

/**
 * Generate temporary token for 2FA verification
 */
export async function generateTempToken(userId) {
  const jwt = (await import('jsonwebtoken')).default;
  const { APP_CONFIG } = await import('../config/app.js');
  
  return jwt.sign(
    { id: userId, purpose: '2fa_verification' },
    APP_CONFIG.JWT_SECRET,
    { expiresIn: '5m' } // Short expiry for security
  );
}

export default {
  login,
  signup,
  signupWithSchool,
  signupSuperAdmin,
  verifyToken,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  generateTempToken
};
