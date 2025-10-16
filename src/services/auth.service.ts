// Authentication Service - JWT-based auth for local PostgreSQL
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface UserProfile {
  id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'super_admin' | 'school_admin' | 'instructor' | 'student';
  department?: string;
  position?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  tenant_id: string;
  role?: 'instructor' | 'student';
}

/**
 * Login user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { email, password } = credentials;

  // Find user by email with profile join
  const result = await query<any>(
    `SELECT 
       u.id, u.tenant_id, u.email, u.role, u.is_active, u.created_at, u.updated_at, u.password_hash,
       p.first_name, p.last_name, p.phone, p.avatar_url
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
  const isValidPassword = await bcrypt.compare(password, (user as any).password_hash);
  
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = user as any;

  return {
    user: userWithoutPassword,
    token
  };
}

/**
 * Register new user
 */
export async function signup(data: SignupData): Promise<AuthResponse> {
  const { email, password, first_name, last_name, phone, tenant_id, role = 'student' } = data;

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Verify tenant exists
  const tenantResult = await query(
    'SELECT id FROM tenants WHERE id = $1',
    [tenant_id]
  );

  if (tenantResult.rows.length === 0) {
    throw new Error('Invalid tenant ID');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create user (auth table only)
  const userResult = await query<any>(
    `INSERT INTO users (email, password_hash, tenant_id, role, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [email, password_hash, tenant_id, role]
  );

  const user = userResult.rows[0];

  // Create profile row
  await query(
    `INSERT INTO user_profiles (user_id, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4)`,
    [user.id, first_name, last_name, phone]
  );

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Remove password_hash from response
  const { password_hash: _, ...userWithoutPassword } = user as any;

  return {
    user: userWithoutPassword,
    token
  };
}

/**
 * Verify JWT token and get user
 */
export async function verifyToken(token: string): Promise<UserProfile> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get fresh user data from database
    const result = await query<UserProfile>(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const { password_hash, ...userWithoutPassword } = result.rows[0] as any;
    return userWithoutPassword;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  const result = await query<UserProfile>(
    'SELECT * FROM users WHERE id = $1 AND is_active = true',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const { password_hash, ...userWithoutPassword } = result.rows[0] as any;
  return userWithoutPassword;
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  // Build dynamic update query
  const allowedFields = ['first_name', 'last_name', 'phone', 'avatar_url', 'settings'];
  const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = [userId, ...updateFields.map(field => (updates as any)[field])];

  const result = await query<UserProfile>(
    `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const { password_hash, ...userWithoutPassword } = result.rows[0] as any;
  return userWithoutPassword;
}

/**
 * Change password
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  // Get current password hash
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
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );
}

/**
 * Request password reset (generates token for email)
 */
export async function requestPasswordReset(email: string): Promise<string> {
  const result = await query(
    'SELECT id FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  if (result.rows.length === 0) {
    // Don't reveal if email exists
    throw new Error('If the email exists, a reset link will be sent');
  }

  const userId = result.rows[0].id;

  // Generate reset token (valid for 1 hour)
  const resetToken = jwt.sign(
    { userId, type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // In production, send email with reset link
  // For now, return the token
  return resetToken;
}

/**
 * Reset password with token
 */
export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET) as any;

    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, decoded.userId]
    );
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
}

export default {
  login,
  signup,
  verifyToken,
  getUserById,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword
};





