// User Management Service
import db from '../lib/db.js';
import bcrypt from 'bcryptjs';

/**
 * Get all users with optional filtering and pagination
 */
export async function getAllUsers({ 
  tenantId, 
  role, 
  status, 
  search, 
  page = 1, 
  limit = 20,
  sortBy = 'created_at',
  sortOrder = 'DESC'
}) {
  try {
    let query = `
      SELECT 
        u.*,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.phone,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain,
        (
          SELECT COUNT(*) 
          FROM enrollments e 
          WHERE e.student_id = u.id
        ) as enrollment_count,
        (
          SELECT COUNT(*) 
          FROM courses c 
          WHERE c.created_by = u.id
        ) as courses_created_count
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filter by tenant (if not super admin viewing all)
    if (tenantId) {
      query += ` AND u.tenant_id = $${paramIndex}`;
      params.push(tenantId);
      paramIndex++;
    }

    // Filter by role
    if (role && role !== 'all') {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    // Filter by status
    if (status !== undefined) {
      query += ` AND u.is_active = $${paramIndex}`;
      params.push(status === 'active');
      paramIndex++;
    }

    // Search by name or email
    if (search) {
      query += ` AND (
        u.email ILIKE $${paramIndex} OR
        p.first_name ILIKE $${paramIndex} OR
        p.last_name ILIKE $${paramIndex} OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add sorting (handle profile fields)
    const validSortColumns = ['created_at', 'email', 'first_name', 'last_name', 'role', 'last_login'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortPrefix = ['first_name', 'last_name'].includes(sortColumn) ? 'p' : 'u';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortPrefix}.${sortColumn} ${sortDir}`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (tenantId) {
      countQuery += ` AND u.tenant_id = $${countParamIndex}`;
      countParams.push(tenantId);
      countParamIndex++;
    }

    if (role && role !== 'all') {
      countQuery += ` AND u.role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    if (status !== undefined) {
      countQuery += ` AND u.is_active = $${countParamIndex}`;
      countParams.push(status === 'active');
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (
        u.email ILIKE $${countParamIndex} OR
        p.first_name ILIKE $${countParamIndex} OR
        p.last_name ILIKE $${countParamIndex} OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Remove password_hash from results
    const users = result.rows.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  try {
    const result = await db.query(`
      SELECT 
        u.*,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.phone,
        p.bio,
        p.date_of_birth,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain,
        (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = u.id) as enrollment_count,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = u.id) as courses_created_count,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.student_id = u.id AND lp.status = 'completed') as lessons_completed
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const { password_hash, ...user } = result.rows[0];
    return user;
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
}

/**
 * Create new user with profile (transaction)
 */
export async function createUser(userData) {
  const client = await db.pool.connect();
  
  try {
    const { email, password, first_name, last_name, role, tenant_id, phone, avatar_url } = userData;

    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Begin transaction
    await client.query('BEGIN');

    // Insert user (authentication table)
    const userResult = await client.query(`
      INSERT INTO users (
        email, password_hash, role, tenant_id, is_active
      )
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [email, password_hash, role, tenant_id]);

    const newUser = userResult.rows[0];

    // Insert user profile (profile data table)
    const profileResult = await client.query(`
      INSERT INTO user_profiles (
        user_id, first_name, last_name, phone, avatar_url
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [newUser.id, first_name, last_name, phone, avatar_url]);

    // Commit transaction
    await client.query('COMMIT');

    // Return combined data
    const { password_hash: _, ...userWithoutPassword } = newUser;
    return {
      ...userWithoutPassword,
      first_name,
      last_name,
      phone,
      avatar_url
    };
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Create user error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update user and/or profile (transaction)
 */
export async function updateUser(userId, updates) {
  const client = await db.pool.connect();
  
  try {
    // Separate user fields from profile fields
    const userFields = ['role', 'is_active', 'settings'];
    const profileFields = ['first_name', 'last_name', 'phone', 'avatar_url', 'bio', 'date_of_birth', 
                          'address_line1', 'address_line2', 'city', 'state_province', 'postal_code', 'country',
                          'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship', 'emergency_contact_email',
                          'guardian_name', 'guardian_email', 'guardian_phone', 'guardian_relationship', 'guardian_address',
                          'nationality', 'preferred_language', 'timezone', 'profile_preferences',
                          'linkedin_url', 'twitter_url', 'website_url'];
    
    const userUpdateFields = [];
    const userValues = [];
    const profileUpdateFields = [];
    const profileValues = [];
    let userParamIndex = 1;
    let profileParamIndex = 1;

    // Build update queries
    for (const [key, value] of Object.entries(updates)) {
      if (userFields.includes(key)) {
        userUpdateFields.push(`${key} = $${userParamIndex}`);
        userValues.push(value);
        userParamIndex++;
      } else if (profileFields.includes(key)) {
        profileUpdateFields.push(`${key} = $${profileParamIndex}`);
        profileValues.push(value);
        profileParamIndex++;
      }
    }

    if (userUpdateFields.length === 0 && profileUpdateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    await client.query('BEGIN');

    // Update user table if needed
    if (userUpdateFields.length > 0) {
      userValues.push(userId);
      const userQuery = `
        UPDATE users
        SET ${userUpdateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${userParamIndex}
      `;
      await client.query(userQuery, userValues);
    }

    // Update profile table if needed
    if (profileUpdateFields.length > 0) {
      profileValues.push(userId);
      const profileQuery = `
        UPDATE user_profiles
        SET ${profileUpdateFields.join(', ')}, updated_at = NOW()
        WHERE user_id = $${profileParamIndex}
      `;
      await client.query(profileQuery, profileValues);
    }

    await client.query('COMMIT');

    // Fetch and return updated user with profile
    const result = await client.query(`
      SELECT 
        u.*,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.phone
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const { password_hash, ...user } = result.rows[0];
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update user error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete user (soft delete - deactivate)
 */
export async function deleteUser(userId) {
  try {
    const result = await db.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return { success: true, message: 'User deactivated successfully' };
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
}

/**
 * Permanently delete user
 */
export async function permanentlyDeleteUser(userId) {
  try {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return { success: true, message: 'User permanently deleted' };
  } catch (error) {
    console.error('Permanently delete user error:', error);
    throw error;
  }
}

/**
 * Reset user password (admin action)
 */
export async function resetUserPassword(userId, newPassword) {
  try {
    const password_hash = await bcrypt.hash(newPassword, 10);

    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [password_hash, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    console.error('Reset user password error:', error);
    throw error;
  }
}

/**
 * Get user statistics and analytics
 */
export async function getUserStatistics(tenantId = null) {
  try {
    const tenantFilter = tenantId ? 'AND u.tenant_id = $1' : '';
    const params = tenantId ? [tenantId] : [];

    const result = await db.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE u.is_active = true) as active_users,
        COUNT(*) FILTER (WHERE u.is_active = false) as inactive_users,
        COUNT(*) FILTER (WHERE u.role = 'super_admin') as super_admins,
        COUNT(*) FILTER (WHERE u.role = 'school_admin') as school_admins,
        COUNT(*) FILTER (WHERE u.role = 'instructor') as instructors,
        COUNT(*) FILTER (WHERE u.role = 'student') as students,
        COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '30 days') as new_users_month,
        COUNT(*) FILTER (WHERE u.last_login >= NOW() - INTERVAL '7 days') as active_last_week,
        COUNT(*) FILTER (WHERE u.last_login >= NOW() - INTERVAL '30 days') as active_last_month
      FROM users u
      WHERE 1=1 ${tenantFilter}
    `, params);

    return result.rows[0];
  } catch (error) {
    console.error('Get user statistics error:', error);
    throw error;
  }
}

/**
 * Get user activity over time
 */
export async function getUserActivityOverTime(tenantId = null, days = 30) {
  try {
    const tenantFilter = tenantId ? 'AND u.tenant_id = $2' : '';
    const params = tenantId ? [days, tenantId] : [days];

    const result = await db.query(`
      SELECT
        DATE(u.created_at) as date,
        COUNT(*) as new_users,
        COUNT(*) FILTER (WHERE u.role = 'student') as new_students,
        COUNT(*) FILTER (WHERE u.role = 'instructor') as new_instructors
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '1 day' * $1 ${tenantFilter}
      GROUP BY DATE(u.created_at)
      ORDER BY date ASC
    `, params);

    return result.rows;
  } catch (error) {
    console.error('Get user activity error:', error);
    throw error;
  }
}

/**
 * Get top users by activity
 */
export async function getTopUsers(tenantId = null, limit = 10) {
  try {
    const tenantFilter = tenantId ? 'AND u.tenant_id = $2' : '';
    const params = tenantId ? [limit, tenantId] : [limit];

    const result = await db.query(`
      SELECT
        u.id,
        u.email,
        u.role,
        u.last_login,
        p.first_name,
        p.last_name,
        p.avatar_url,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT lp.id) FILTER (WHERE lp.status = 'completed') as completed_lessons,
        COUNT(DISTINCT c.id) as courses_created
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN lesson_progress lp ON u.id = lp.student_id
      LEFT JOIN courses c ON u.id = c.created_by
      WHERE u.is_active = true ${tenantFilter}
      GROUP BY u.id, u.email, u.role, u.last_login, p.first_name, p.last_name, p.avatar_url
      ORDER BY 
        CASE 
          WHEN u.role = 'student' THEN total_enrollments + completed_lessons
          WHEN u.role = 'instructor' THEN courses_created * 10
          ELSE 0
        END DESC
      LIMIT $1
    `, params);

    return result.rows;
  } catch (error) {
    console.error('Get top users error:', error);
    throw error;
  }
}

/**
 * Bulk update users
 */
export async function bulkUpdateUsers(userIds, updates) {
  try {
    const allowedUpdates = ['role', 'is_active'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userIds);
    const query = `
      UPDATE users
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = ANY($${paramIndex}::uuid[])
      RETURNING id
    `;

    const result = await db.query(query, values);

    return {
      success: true,
      updatedCount: result.rows.length,
      message: `${result.rows.length} users updated successfully`
    };
  } catch (error) {
    console.error('Bulk update users error:', error);
    throw error;
  }
}

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  permanentlyDeleteUser,
  resetUserPassword,
  getUserStatistics,
  getUserActivityOverTime,
  getTopUsers,
  bulkUpdateUsers
};

