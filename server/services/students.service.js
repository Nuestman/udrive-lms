// Student Management Service
import { query } from '../lib/db.js';
import bcrypt from 'bcryptjs';

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Get all students with optional filters
 */
export async function getStudents(tenantId, filters = {}, isSuperAdmin = false) {
  let queryText = `
    SELECT u.*, p.first_name, p.last_name, p.avatar_url, p.phone,
      (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id) as courses_enrolled,
      (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id AND status = 'completed') as courses_completed,
      (SELECT AVG(progress_percentage) FROM enrollments WHERE student_id = u.id) as overall_progress
  `;

  const params = [];
  let paramIndex = 1;
  const conditions = ["u.role = 'student'"];

  // Super Admin: Include school name
  if (isSuperAdmin) {
    queryText += `, t.name as school_name, t.id as school_id
    FROM users u
    LEFT JOIN user_profiles p ON p.user_id = u.id
    LEFT JOIN tenants t ON u.tenant_id = t.id`;
  } else {
    // Tenant-scoped: Only their students
    queryText += `
    FROM users u
    LEFT JOIN user_profiles p ON p.user_id = u.id`;
    conditions.push(`u.tenant_id = $${paramIndex}`);
    params.push(tenantId);
    paramIndex++;
  }

  // Apply filters
  if (filters.status) {
    if (filters.status === 'active') {
      conditions.push(`u.is_active = true`);
    } else if (filters.status === 'inactive') {
      conditions.push(`u.is_active = false`);
    }
  }

  if (filters.search) {
    conditions.push(`(
      p.first_name ILIKE $${paramIndex} OR 
      p.last_name ILIKE $${paramIndex} OR 
      u.email ILIKE $${paramIndex}
    )`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  queryText += ` WHERE ${conditions.join(' AND ')} ORDER BY u.created_at DESC`;

  const result = await query(queryText, params);
  return result.rows;
}

/**
 * Get student by ID
 */
export async function getStudentById(studentId, tenantId, isSuperAdmin = false) {
  let result;

  if (isSuperAdmin) {
    // Super Admin: Access any student
    result = await query(
      `SELECT u.*, p.first_name, p.last_name, p.avatar_url, p.phone,
        t.name as school_name,
        (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id) as courses_enrolled,
        (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id AND status = 'completed') as courses_completed,
        (SELECT AVG(progress_percentage) FROM enrollments WHERE student_id = u.id) as overall_progress
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1 AND u.role = 'student'`,
      [studentId]
    );
  } else {
    // Tenant-scoped: Only their student
    result = await query(
      `SELECT u.*, p.first_name, p.last_name, p.avatar_url, p.phone,
        (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id) as courses_enrolled,
        (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id AND status = 'completed') as courses_completed,
        (SELECT AVG(progress_percentage) FROM enrollments WHERE student_id = u.id) as overall_progress
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.tenant_id = $2 AND u.role = 'student'`,
      [studentId, tenantId]
    );
  }

  if (result.rows.length === 0) {
    throw new NotFoundError('Student not found');
  }

  return result.rows[0];
}

/**
 * Create new student
 */
export async function createStudent(studentData, tenantId) {
  const { email, password, first_name, last_name, phone } = studentData;

  // Check if email already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password || 'welcome123', 10);

  // Create student
  const result = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, tenant_id, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, 'student', true)
     RETURNING *`,
    [email, password_hash, first_name, last_name, phone, tenantId]
  );

  const { password_hash: _, ...studentWithoutPassword } = result.rows[0];
  return studentWithoutPassword;
}

/**
 * Update student
 */
export async function updateStudent(studentId, studentData, tenantId, isSuperAdmin = false) {
  const { first_name, last_name, phone, email, is_active } = studentData;

  // Verify student access
  let studentCheck;
  if (isSuperAdmin) {
    // Super Admin: Just verify student exists
    studentCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND role = \'student\'',
      [studentId]
    );
  } else {
    // Tenant-scoped: Verify student belongs to their tenant
    studentCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role = \'student\'',
      [studentId, tenantId]
    );
  }

  if (studentCheck.rows.length === 0) {
    throw new NotFoundError('Student not found or access denied');
  }

  // Check email uniqueness if updating email
  if (email) {
    const emailCheck = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, studentId]
    );

    if (emailCheck.rows.length > 0) {
      throw new Error('Email already in use');
    }
  }

  const result = await query(
    `UPDATE users
     SET first_name = COALESCE($2, first_name),
         last_name = COALESCE($3, last_name),
         phone = COALESCE($4, phone),
         email = COALESCE($5, email),
         is_active = COALESCE($6, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [studentId, first_name, last_name, phone, email, is_active]
  );

  const { password_hash, ...studentWithoutPassword } = result.rows[0];
  return studentWithoutPassword;
}

/**
 * Delete (deactivate) student
 */
export async function deleteStudent(studentId, tenantId, isSuperAdmin = false) {
  // Verify student access
  let studentCheck;
  
  if (isSuperAdmin) {
    studentCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND role = \'student\'',
      [studentId]
    );
  } else {
    studentCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role = \'student\'',
      [studentId, tenantId]
    );
  }

  if (studentCheck.rows.length === 0) {
    throw new NotFoundError('Student not found or access denied');
  }

  // Soft delete - deactivate account
  await query(
    'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [studentId]
  );

  return { success: true, message: 'Student deactivated' };
}

/**
 * Admin reset student password to default (NEW!)
 */
export async function adminResetPassword(studentId, tenantId, isSuperAdmin = false, newPassword = 'welcome123') {
  // Verify student access
  let studentCheck;
  
  if (isSuperAdmin) {
    studentCheck = await query(
      `SELECT u.id, u.email, p.first_name, p.last_name 
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.role = 'student'`,
      [studentId]
    );
  } else {
    studentCheck = await query(
      `SELECT u.id, u.email, p.first_name, p.last_name 
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.tenant_id = $2 AND u.role = 'student'`,
      [studentId, tenantId]
    );
  }

  if (studentCheck.rows.length === 0) {
    throw new NotFoundError('Student not found or access denied');
  }

  const student = studentCheck.rows[0];

  // Hash new password
  const password_hash = await bcrypt.hash(newPassword, 10);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [password_hash, studentId]
  );

  return { 
    success: true, 
    message: `Password reset for ${student.first_name} ${student.last_name}`,
    email: student.email,
    tempPassword: newPassword
  };
}

export default {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  adminResetPassword
};
