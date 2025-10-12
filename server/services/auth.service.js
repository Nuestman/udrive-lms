// Authentication Service - Enhanced with tenant-aware signup
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Login user
 */
export async function login(credentials) {
  const { email, password } = credentials;
  
  // Get user
  const result = await query(
    'SELECT * FROM user_profiles WHERE email = $1 AND is_active = true',
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

  // Update last login
  await query(
    'UPDATE user_profiles SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
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
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Remove password from response
  const { password_hash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
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
    'SELECT id FROM user_profiles WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create user
  const result = await query(
    `INSERT INTO user_profiles (email, password_hash, first_name, last_name, phone, tenant_id, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING *`,
    [email, password_hash, first_name, last_name, phone, tenantIdToUse, role || 'student']
  );

  const user = result.rows[0];

  // Generate token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      tenant_id: user.tenant_id
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password_hash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
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
    'SELECT id FROM user_profiles WHERE email = $1',
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

  // Create school admin user
  const userResult = await query(
    `INSERT INTO user_profiles (email, password_hash, first_name, last_name, phone, tenant_id, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, 'school_admin', true)
     RETURNING *`,
    [email, password_hash, first_name, last_name, phone, tenant.id]
  );

  const user = userResult.rows[0];

  // Generate token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      tenant_id: user.tenant_id
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password_hash: _, ...userWithoutPassword } = user;

  return { 
    user: userWithoutPassword, 
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
    "SELECT id FROM user_profiles WHERE role = 'super_admin' AND is_active = true"
  );

  if (existingSuperAdmin.rows.length > 0) {
    throw new Error('Super admin already exists. Contact system administrator.');
  }

  const { email, password, first_name, last_name } = userData;

  // Check if email exists
  const existingUser = await query(
    'SELECT id FROM user_profiles WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create super admin (no tenant)
  const result = await query(
    `INSERT INTO user_profiles (email, password_hash, first_name, last_name, tenant_id, role, is_active)
     VALUES ($1, $2, $3, $4, NULL, 'super_admin', true)
     RETURNING *`,
    [email, password_hash, first_name, last_name]
  );

  const user = result.rows[0];

  // Generate token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      tenant_id: null
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password_hash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

/**
 * Verify JWT token
 */
export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data
    const result = await query(
      'SELECT * FROM user_profiles WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found or inactive');
    }

    const { password_hash, ...userWithoutPassword } = result.rows[0];
    return userWithoutPassword;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId, updates) {
  const { first_name, last_name, phone, avatar_url } = updates;

  const result = await query(
    `UPDATE user_profiles
     SET first_name = COALESCE($2, first_name),
         last_name = COALESCE($3, last_name),
         phone = COALESCE($4, phone),
         avatar_url = COALESCE($5, avatar_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [userId, first_name, last_name, phone, avatar_url]
  );

  const { password_hash, ...userWithoutPassword } = result.rows[0];
  return userWithoutPassword;
}

/**
 * Change password
 */
export async function changePassword(userId, currentPassword, newPassword) {
  // Get user
  const result = await query(
    'SELECT password_hash FROM user_profiles WHERE id = $1',
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
    'UPDATE user_profiles SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
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
    'SELECT id FROM user_profiles WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    // Don't reveal if email exists (security)
    return { success: true };
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { id: result.rows[0].id, purpose: 'reset_password' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // In production: Send email with reset link
  // For now: Return token for testing

  return resetToken;
}

/**
 * Reset password with token
 */
export async function resetPassword(resetToken, newPassword) {
  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET);

    if (decoded.purpose !== 'reset_password') {
      throw new Error('Invalid reset token');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE user_profiles SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [password_hash, decoded.id]
    );

    return { success: true };
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
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
  resetPassword
};
