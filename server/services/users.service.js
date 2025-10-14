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
        up.*,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain,
        (
          SELECT COUNT(*) 
          FROM enrollments e 
          WHERE e.student_id = up.id
        ) as enrollment_count,
        (
          SELECT COUNT(*) 
          FROM courses c 
          WHERE c.created_by = up.id
        ) as courses_created_count
      FROM user_profiles up
      LEFT JOIN tenants t ON up.tenant_id = t.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filter by tenant (if not super admin viewing all)
    if (tenantId) {
      query += ` AND up.tenant_id = $${paramIndex}`;
      params.push(tenantId);
      paramIndex++;
    }

    // Filter by role
    if (role && role !== 'all') {
      query += ` AND up.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    // Filter by status
    if (status !== undefined) {
      query += ` AND up.is_active = $${paramIndex}`;
      params.push(status === 'active');
      paramIndex++;
    }

    // Search by name or email
    if (search) {
      query += ` AND (
        up.email ILIKE $${paramIndex} OR
        up.first_name ILIKE $${paramIndex} OR
        up.last_name ILIKE $${paramIndex} OR
        CONCAT(up.first_name, ' ', up.last_name) ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add sorting
    const validSortColumns = ['created_at', 'email', 'first_name', 'last_name', 'role', 'last_login'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY up.${sortColumn} ${sortDir}`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM user_profiles up WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (tenantId) {
      countQuery += ` AND up.tenant_id = $${countParamIndex}`;
      countParams.push(tenantId);
      countParamIndex++;
    }

    if (role && role !== 'all') {
      countQuery += ` AND up.role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    if (status !== undefined) {
      countQuery += ` AND up.is_active = $${countParamIndex}`;
      countParams.push(status === 'active');
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (
        up.email ILIKE $${countParamIndex} OR
        up.first_name ILIKE $${countParamIndex} OR
        up.last_name ILIKE $${countParamIndex} OR
        CONCAT(up.first_name, ' ', up.last_name) ILIKE $${countParamIndex}
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
        up.*,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain,
        (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = up.id) as enrollment_count,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = up.id) as courses_created_count,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.student_id = up.id AND lp.status = 'completed') as lessons_completed
      FROM user_profiles up
      LEFT JOIN tenants t ON up.tenant_id = t.id
      WHERE up.id = $1
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
 * Create new user
 */
export async function createUser(userData) {
  try {
    const { email, password, first_name, last_name, role, tenant_id, phone, avatar_url } = userData;

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT id FROM user_profiles WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(`
      INSERT INTO user_profiles (
        email, password_hash, first_name, last_name, role, tenant_id, phone, avatar_url, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `, [email, password_hash, first_name, last_name, role, tenant_id, phone, avatar_url]);

    const { password_hash: _, ...user } = result.rows[0];
    return user;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(userId, updates) {
  try {
    const allowedUpdates = ['first_name', 'last_name', 'phone', 'avatar_url', 'role', 'is_active', 'settings'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Build update query
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

    values.push(userId);
    const query = `
      UPDATE user_profiles
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const { password_hash, ...user } = result.rows[0];
    return user;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
}

/**
 * Delete user (soft delete - deactivate)
 */
export async function deleteUser(userId) {
  try {
    const result = await db.query(
      'UPDATE user_profiles SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
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
      'DELETE FROM user_profiles WHERE id = $1 RETURNING id',
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
      'UPDATE user_profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
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
    const tenantFilter = tenantId ? 'AND up.tenant_id = $1' : '';
    const params = tenantId ? [tenantId] : [];

    const result = await db.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE up.is_active = true) as active_users,
        COUNT(*) FILTER (WHERE up.is_active = false) as inactive_users,
        COUNT(*) FILTER (WHERE up.role = 'super_admin') as super_admins,
        COUNT(*) FILTER (WHERE up.role = 'school_admin') as school_admins,
        COUNT(*) FILTER (WHERE up.role = 'instructor') as instructors,
        COUNT(*) FILTER (WHERE up.role = 'student') as students,
        COUNT(*) FILTER (WHERE up.created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE up.created_at >= NOW() - INTERVAL '30 days') as new_users_month,
        COUNT(*) FILTER (WHERE up.last_login >= NOW() - INTERVAL '7 days') as active_last_week,
        COUNT(*) FILTER (WHERE up.last_login >= NOW() - INTERVAL '30 days') as active_last_month
      FROM user_profiles up
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
    const tenantFilter = tenantId ? 'AND up.tenant_id = $2' : '';
    const params = tenantId ? [days, tenantId] : [days];

    const result = await db.query(`
      SELECT
        DATE(up.created_at) as date,
        COUNT(*) as new_users,
        COUNT(*) FILTER (WHERE up.role = 'student') as new_students,
        COUNT(*) FILTER (WHERE up.role = 'instructor') as new_instructors
      FROM user_profiles up
      WHERE up.created_at >= NOW() - INTERVAL '1 day' * $1 ${tenantFilter}
      GROUP BY DATE(up.created_at)
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
    const tenantFilter = tenantId ? 'AND up.tenant_id = $2' : '';
    const params = tenantId ? [limit, tenantId] : [limit];

    const result = await db.query(`
      SELECT
        up.id,
        up.email,
        up.first_name,
        up.last_name,
        up.role,
        up.avatar_url,
        up.last_login,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT lp.id) FILTER (WHERE lp.status = 'completed') as completed_lessons,
        COUNT(DISTINCT c.id) as courses_created
      FROM user_profiles up
      LEFT JOIN enrollments e ON up.id = e.student_id
      LEFT JOIN lesson_progress lp ON up.id = lp.student_id
      LEFT JOIN courses c ON up.id = c.created_by
      WHERE up.is_active = true ${tenantFilter}
      GROUP BY up.id
      ORDER BY 
        CASE 
          WHEN up.role = 'student' THEN total_enrollments + completed_lessons
          WHEN up.role = 'instructor' THEN courses_created * 10
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
      UPDATE user_profiles
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

