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
        up.*,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = up.id) as courses_count,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = up.id AND c.status = 'published') as published_courses,
        (SELECT COUNT(DISTINCT e.student_id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = up.id) as total_students,
        (SELECT AVG(e.progress_percentage)::INTEGER 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = up.id) as avg_student_progress
      FROM user_profiles up
      LEFT JOIN tenants t ON up.tenant_id = t.id
      WHERE up.role = 'instructor'
    `;

    const params = [];
    let paramIndex = 1;

    // Filter by tenant
    if (tenantId) {
      query += ` AND up.tenant_id = $${paramIndex}`;
      params.push(tenantId);
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
    const validSortColumns = ['created_at', 'email', 'first_name', 'last_name', 'courses_count', 'total_students'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn === 'courses_count' || sortColumn === 'total_students' ? sortColumn : `up.${sortColumn}`} ${sortDir}`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM user_profiles up WHERE up.role = \'instructor\'';
    const countParams = [];
    let countParamIndex = 1;

    if (tenantId) {
      countQuery += ` AND up.tenant_id = $${countParamIndex}`;
      countParams.push(tenantId);
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
    const instructors = result.rows.map(instructor => {
      const { password_hash, ...instructorWithoutPassword } = instructor;
      return instructorWithoutPassword;
    });

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
        up.*,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = up.id) as courses_count,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = up.id AND c.status = 'published') as published_courses,
        (SELECT COUNT(*) FROM courses c WHERE c.created_by = up.id AND c.status = 'draft') as draft_courses,
        (SELECT COUNT(DISTINCT e.student_id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = up.id) as total_students,
        (SELECT COUNT(DISTINCT e.id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = up.id AND e.status = 'active') as active_enrollments,
        (SELECT COUNT(DISTINCT e.id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = up.id AND e.status = 'completed') as completed_enrollments,
        (SELECT AVG(e.progress_percentage)::INTEGER 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.created_by = up.id) as avg_student_progress
      FROM user_profiles up
      LEFT JOIN tenants t ON up.tenant_id = t.id
      WHERE up.id = $1 AND up.role = 'instructor'
    `, [instructorId]);

    if (result.rows.length === 0) {
      throw new Error('Instructor not found');
    }

    const { password_hash, ...instructor } = result.rows[0];
    return instructor;
  } catch (error) {
    console.error('Get instructor by ID error:', error);
    throw error;
  }
}

/**
 * Create new instructor
 */
export async function createInstructor(instructorData) {
  try {
    const { email, password, first_name, last_name, tenant_id, phone, avatar_url } = instructorData;

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

    // Insert instructor with role = 'instructor'
    const result = await db.query(`
      INSERT INTO user_profiles (
        email, password_hash, first_name, last_name, role, tenant_id, phone, avatar_url, is_active
      )
      VALUES ($1, $2, $3, $4, 'instructor', $5, $6, $7, true)
      RETURNING *
    `, [email, password_hash, first_name, last_name, tenant_id, phone, avatar_url]);

    const { password_hash: _, ...instructor } = result.rows[0];
    return instructor;
  } catch (error) {
    console.error('Create instructor error:', error);
    throw error;
  }
}

/**
 * Update instructor
 */
export async function updateInstructor(instructorId, updates) {
  try {
    const allowedUpdates = ['first_name', 'last_name', 'phone', 'avatar_url', 'is_active', 'settings'];
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

    values.push(instructorId);
    const query = `
      UPDATE user_profiles
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND role = 'instructor'
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Instructor not found');
    }

    const { password_hash, ...instructor } = result.rows[0];
    return instructor;
  } catch (error) {
    console.error('Update instructor error:', error);
    throw error;
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
         JOIN user_profiles u ON c.created_by = u.id 
         WHERE u.role = 'instructor' ${tenantFilter.replace('up.', 'u.')}) as total_courses,
        (SELECT COUNT(*) FROM courses c 
         JOIN user_profiles u ON c.created_by = u.id 
         WHERE u.role = 'instructor' AND c.status = 'published' ${tenantFilter.replace('up.', 'u.')}) as published_courses,
        (SELECT COUNT(DISTINCT e.student_id) 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id
         JOIN user_profiles u ON c.created_by = u.id
         WHERE u.role = 'instructor' ${tenantFilter.replace('up.', 'u.')}) as total_students,
        (SELECT AVG(courses_per_instructor)::INTEGER FROM (
          SELECT COUNT(*) as courses_per_instructor
          FROM courses c
          JOIN user_profiles u ON c.created_by = u.id
          WHERE u.role = 'instructor' ${tenantFilter.replace('up.', 'u.')}
          GROUP BY u.id
        ) subquery) as avg_courses_per_instructor
      FROM user_profiles up
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
      FROM user_profiles up
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
        up.id,
        up.email,
        up.first_name,
        up.last_name,
        up.avatar_url,
        up.created_at,
        COUNT(DISTINCT c.id) as courses_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published') as published_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_enrollments,
        AVG(e.progress_percentage)::INTEGER as avg_student_progress
      FROM user_profiles up
      LEFT JOIN courses c ON up.id = c.created_by
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE up.role = 'instructor' AND up.is_active = true ${tenantFilter}
      GROUP BY up.id
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
      'SELECT id FROM user_profiles WHERE id = $1 AND role = \'instructor\' AND is_active = true',
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

