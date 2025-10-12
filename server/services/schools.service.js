// Schools/Tenants Service - Manage schools (super admin only)
import { query } from '../lib/db.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Get all schools/tenants
 * Super admin only
 */
export async function getAllSchools() {
  const result = await query(
    `SELECT t.*,
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = t.id) as total_users,
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = t.id AND role = 'student') as student_count,
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = t.id AND role = 'instructor') as instructor_count,
      (SELECT COUNT(*) FROM courses WHERE tenant_id = t.id) as course_count,
      (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.tenant_id = t.id) as enrollment_count
     FROM tenants t
     ORDER BY t.created_at DESC`
  );

  return result.rows;
}

/**
 * Get single school/tenant by ID
 */
export async function getSchoolById(schoolId) {
  const result = await query(
    `SELECT t.*,
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = t.id) as total_users,
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = t.id AND role = 'student') as student_count,
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = t.id AND role = 'instructor') as instructor_count,
      (SELECT COUNT(*) FROM courses WHERE tenant_id = t.id) as course_count,
      (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.tenant_id = t.id) as enrollment_count
     FROM tenants t
     WHERE t.id = $1`,
    [schoolId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('School not found');
  }

  return result.rows[0];
}

/**
 * Create new school/tenant
 */
export async function createSchool(schoolData) {
  const { name, subdomain, contact_email, contact_phone, address, settings } = schoolData;

  // Validation
  if (!name || name.trim().length === 0) {
    throw new ValidationError('School name is required');
  }

  if (!subdomain || subdomain.trim().length === 0) {
    throw new ValidationError('Subdomain is required');
  }

  // Check if subdomain already exists
  const existingSchool = await query(
    'SELECT id FROM tenants WHERE subdomain = $1',
    [subdomain]
  );

  if (existingSchool.rows.length > 0) {
    throw new ValidationError('Subdomain already in use');
  }

  // Create school
  const result = await query(
    `INSERT INTO tenants (name, subdomain, contact_email, contact_phone, address, settings, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING *`,
    [name, subdomain, contact_email, contact_phone, address, settings || {}]
  );

  return result.rows[0];
}

/**
 * Update school/tenant
 */
export async function updateSchool(schoolId, schoolData) {
  const { name, subdomain, contact_email, contact_phone, address, settings, is_active } = schoolData;

  // Check if school exists
  const existing = await query('SELECT id FROM tenants WHERE id = $1', [schoolId]);
  if (existing.rows.length === 0) {
    throw new NotFoundError('School not found');
  }

  // If changing subdomain, check it's not in use
  if (subdomain) {
    const subdomainCheck = await query(
      'SELECT id FROM tenants WHERE subdomain = $1 AND id != $2',
      [subdomain, schoolId]
    );

    if (subdomainCheck.rows.length > 0) {
      throw new ValidationError('Subdomain already in use');
    }
  }

  const result = await query(
    `UPDATE tenants
     SET name = COALESCE($2, name),
         subdomain = COALESCE($3, subdomain),
         contact_email = COALESCE($4, contact_email),
         contact_phone = COALESCE($5, contact_phone),
         address = COALESCE($6, address),
         settings = COALESCE($7, settings),
         is_active = COALESCE($8, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [schoolId, name, subdomain, contact_email, contact_phone, address, settings, is_active]
  );

  return result.rows[0];
}

/**
 * Delete/deactivate school
 */
export async function deleteSchool(schoolId) {
  // Check if school exists
  const existing = await query('SELECT id FROM tenants WHERE id = $1', [schoolId]);
  if (existing.rows.length === 0) {
    throw new NotFoundError('School not found');
  }

  // Check if school has active users
  const usersCheck = await query(
    'SELECT COUNT(*) as count FROM user_profiles WHERE tenant_id = $1 AND is_active = true',
    [schoolId]
  );

  if (parseInt(usersCheck.rows[0].count) > 0) {
    throw new ValidationError('Cannot delete school with active users. Deactivate users first.');
  }

  // Soft delete - just deactivate
  await query(
    'UPDATE tenants SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [schoolId]
  );

  return { success: true };
}

/**
 * Get school statistics
 */
export async function getSchoolStats(schoolId) {
  const stats = await query(
    `SELECT 
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = $1) as total_users,
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = $1 AND role = 'student') as students,
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = $1 AND role = 'instructor') as instructors,
      (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = $1 AND role = 'school_admin') as admins,
      (SELECT COUNT(*) FROM courses WHERE tenant_id = $1) as courses,
      (SELECT COUNT(*) FROM courses WHERE tenant_id = $1 AND status = 'published') as published_courses,
      (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.tenant_id = $1) as enrollments,
      (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.tenant_id = $1 AND e.status = 'completed') as completed_enrollments`,
    [schoolId]
  );

  return stats.rows[0];
}

export default {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolStats
};

