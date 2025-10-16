// Instructor Management Service
import db from '../lib/db.js';
import bcrypt from 'bcryptjs';

/**
 * Get all instructors with optional filtering and pagination
 */
export async function getAllInstructors({ 
  tenantId, 
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
        u.id,
        u.email,
        u.role,
        u.tenant_id,
        u.is_active,
        u.settings,
        u.created_at,
        u.updated_at,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.phone,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = u.id) as courses_count,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = u.id AND c.status = 'published') as published_courses,
        (SELECT COUNT(DISTINCT e.student_id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = u.id) as total_students,
        (SELECT AVG(e.progress_percentage)::INTEGER 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = u.id) as avg_student_progress
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.role = 'instructor'
    `;

    const params = [];
    let paramIndex = 1;

    // Filter by tenant
    if (tenantId) {
      query += ` AND u.tenant_id = $${paramIndex}`;
      params.push(tenantId);
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

    // Add sorting
    const validSortColumns = ['created_at', 'email', 'first_name', 'last_name', 'courses_count', 'total_students'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${
      sortColumn === 'courses_count' || sortColumn === 'total_students'
        ? sortColumn
        : sortColumn === 'first_name' || sortColumn === 'last_name'
          ? `p.${sortColumn}`
          : `u.${sortColumn}`
    } ${sortDir}`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.role = \'instructor\'';
    const countParams = [];
    let countParamIndex = 1;

    if (tenantId) {
      countQuery += ` AND u.tenant_id = $${countParamIndex}`;
      countParams.push(tenantId);
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
    const instructors = result.rows.map(instructor => instructor);

    return {
      instructors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('Get all instructors error:', error);
    throw error;
  }
}

/**
 * Get instructor by ID with detailed stats
 */
export async function getInstructorById(instructorId) {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.tenant_id,
        u.is_active,
        u.settings,
        u.created_at,
        u.updated_at,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.phone,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = u.id) as courses_count,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = u.id AND c.status = 'published') as published_courses,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = u.id AND c.status = 'draft') as draft_courses,
        (SELECT COUNT(DISTINCT e.student_id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = u.id) as total_students,
        (SELECT COUNT(DISTINCT e.id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = u.id AND e.status = 'active') as active_enrollments,
        (SELECT COUNT(DISTINCT e.id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = u.id AND e.status = 'completed') as completed_enrollments,
        (SELECT AVG(e.progress_percentage)::INTEGER 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = u.id) as avg_student_progress
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1 AND u.role = 'instructor'
    `, [instructorId]);

    if (result.rows.length === 0) {
      throw new Error('Instructor not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Get instructor by ID error:', error);
    throw error;
  }
}

/**
 * Create new instructor
 */
export async function createInstructor(instructorData) {
  const client = await db.pool.connect();
  try {
    const { email, password, first_name, last_name, tenant_id, phone, avatar_url } = instructorData;

    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already exists');
    }

    const password_hash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, tenant_id, is_active)
       VALUES ($1, $2, 'instructor', $3, true)
       RETURNING *`,
      [email, password_hash, tenant_id]
    );

    const newUser = userResult.rows[0];

    await client.query(
      `INSERT INTO user_profiles (user_id, first_name, last_name, phone, avatar_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [newUser.id, first_name, last_name, phone, avatar_url]
    );

    await client.query('COMMIT');

    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      tenant_id: newUser.tenant_id,
      is_active: newUser.is_active,
      settings: newUser.settings,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
      first_name,
      last_name,
      phone,
      avatar_url
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create instructor error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update instructor
 */
export async function updateInstructor(instructorId, updates) {
  const client = await db.pool.connect();
  try {
    const userFields = ['is_active', 'settings'];
    const profileFields = ['first_name', 'last_name', 'phone', 'avatar_url'];

    const userUpdateFields = [];
    const userValues = [];
    const profileUpdateFields = [];
    const profileValues = [];

    for (const [key, value] of Object.entries(updates)) {
      if (userFields.includes(key)) {
        userUpdateFields.push(key);
        userValues.push(value);
      } else if (profileFields.includes(key)) {
        profileUpdateFields.push(key);
        profileValues.push(value);
      }
    }

    if (userUpdateFields.length === 0 && profileUpdateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    await client.query('BEGIN');

    if (userUpdateFields.length > 0) {
      const setClause = userUpdateFields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      await client.query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${userUpdateFields.length + 1} AND role = 'instructor'`,
        [...userValues, instructorId]
      );
    }

    if (profileUpdateFields.length > 0) {
      const setClause = profileUpdateFields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      await client.query(
        `UPDATE user_profiles SET ${setClause}, updated_at = NOW() WHERE user_id = $${profileUpdateFields.length + 1}`,
        [...profileValues, instructorId]
      );
    }

    await client.query('COMMIT');

    const result = await db.query(
      `SELECT 
         u.id, u.email, u.role, u.tenant_id, u.is_active, u.settings, u.created_at, u.updated_at,
         p.first_name, p.last_name, p.avatar_url, p.phone
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.role = 'instructor'`,
      [instructorId]
    );

    if (result.rows.length === 0) {
      throw new Error('Instructor not found');
    }

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update instructor error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get instructor statistics
 */
export async function getInstructorStatistics(tenantId = null) {
  try {
    const tenantFilter = tenantId ? 'AND up.tenant_id = $1' : '';
    const params = tenantId ? [tenantId] : [];

    const result = await db.query(`
      SELECT
        COUNT(*) as total_instructors,
        COUNT(*) FILTER (WHERE up.is_active = true) as active_instructors,
        COUNT(*) FILTER (WHERE up.is_active = false) as inactive_instructors,
        COUNT(*) FILTER (WHERE up.created_at >= NOW() - INTERVAL '7 days') as new_instructors_week,
        COUNT(*) FILTER (WHERE up.created_at >= NOW() - INTERVAL '30 days') as new_instructors_month,
        (SELECT COUNT(*) FROM courses c 
         JOIN users u ON c.created_by = u.id 
         WHERE u.role = 'instructor' ${tenantFilter.replace('up.', 'u.')}) as total_courses,
        (SELECT COUNT(*) FROM courses c 
         JOIN users u ON c.created_by = u.id 
         WHERE u.role = 'instructor' AND c.status = 'published' ${tenantFilter.replace('up.', 'u.')}) as published_courses,
        (SELECT COUNT(DISTINCT e.student_id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id
         JOIN users u ON c.created_by = u.id
         WHERE u.role = 'instructor' ${tenantFilter.replace('up.', 'u.')}) as total_students,
        (SELECT AVG(courses_per_instructor)::INTEGER FROM (
          SELECT COUNT(*) as courses_per_instructor
          FROM courses c
          JOIN users u ON c.created_by = u.id
          WHERE u.role = 'instructor' ${tenantFilter.replace('up.', 'u.')}
          GROUP BY u.id
        ) subquery) as avg_courses_per_instructor
      FROM users up
      WHERE up.role = 'instructor' ${tenantFilter}
    `, params);

    return result.rows[0];
  } catch (error) {
    console.error('Get instructor statistics error:', error);
    throw error;
  }
}

/**
 * Get instructor activity over time
 */
export async function getInstructorActivity(tenantId = null, days = 30) {
  try {
    const tenantFilter = tenantId ? 'AND up.tenant_id = $2' : '';
    const params = tenantId ? [days, tenantId] : [days];

    const result = await db.query(`
      SELECT
        DATE(up.created_at) as date,
        COUNT(*) as new_instructors
      FROM users up
      WHERE up.role = 'instructor' 
        AND up.created_at >= NOW() - INTERVAL '1 day' * $1 
        ${tenantFilter}
      GROUP BY DATE(up.created_at)
      ORDER BY date ASC
    `, params);

    return result.rows;
  } catch (error) {
    console.error('Get instructor activity error:', error);
    throw error;
  }
}

/**
 * Get top instructors by performance
 */
export async function getTopInstructors(tenantId = null, limit = 10) {
  try {
    const tenantFilter = tenantId ? 'AND up.tenant_id = $2' : '';
    const params = tenantId ? [limit, tenantId] : [limit];

    const result = await db.query(`
      SELECT
        u.id,
        u.email,
        p.first_name,
        p.last_name,
        p.avatar_url,
        u.created_at,
        COUNT(DISTINCT c.id) as courses_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published') as published_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_enrollments,
        AVG(e.progress_percentage)::INTEGER as avg_student_progress
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN courses c ON u.id = c.created_by
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE u.role = 'instructor' AND u.is_active = true ${tenantFilter}
      GROUP BY u.id, p.first_name, p.last_name, p.avatar_url
      ORDER BY 
        COUNT(DISTINCT c.id) DESC,
        COUNT(DISTINCT e.student_id) DESC,
        AVG(e.progress_percentage) DESC
      LIMIT $1
    `, params);

    return result.rows;
  } catch (error) {
    console.error('Get top instructors error:', error);
    throw error;
  }
}

/**
 * Get instructor courses
 */
export async function getInstructorCourses(instructorId) {
  try {
    const result = await db.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT m.id) as module_count,
        COUNT(DISTINCT e.id) as enrollment_count,
        COUNT(DISTINCT e.student_id) as student_count,
        AVG(e.progress_percentage)::INTEGER as avg_progress
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.created_by = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [instructorId]);

    return result.rows;
  } catch (error) {
    console.error('Get instructor courses error:', error);
    throw error;
  }
}

/**
 * Assign course to instructor
 */
export async function assignCourseToInstructor(instructorId, courseId) {
  try {
    // Verify instructor exists and is active
    const instructorCheck = await db.query(
      'SELECT id FROM users WHERE id = $1 AND role = \'instructor\' AND is_active = true',
      [instructorId]
    );

    if (instructorCheck.rows.length === 0) {
      throw new Error('Instructor not found or inactive');
    }

    // Update course creator
    const result = await db.query(
      'UPDATE courses SET created_by = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [instructorId, courseId]
    );

    if (result.rows.length === 0) {
      throw new Error('Course not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Assign course error:', error);
    throw error;
  }
}

export default {
  getAllInstructors,
  getInstructorById,
  createInstructor,
  updateInstructor,
  getInstructorStatistics,
  getInstructorActivity,
  getTopInstructors,
  getInstructorCourses,
  assignCourseToInstructor
};

