// Certificate Service - Certificate generation and management
import { query } from '../lib/db.js';
import { NotFoundError } from '../middleware/errorHandler.js';

/**
 * Generate certificate for completed course
 */
export async function generateCertificate(enrollmentId, tenantId, isSuperAdmin = false) {
  // Get enrollment details
  let enrollmentQuery;
  
  if (isSuperAdmin) {
    enrollmentQuery = await query(
      `SELECT e.*, 
        u.first_name, u.last_name, u.email,
        c.title as course_title, c.duration_weeks,
        t.name as school_name
       FROM enrollments e
       JOIN user_profiles u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       WHERE e.id = $1`,
      [enrollmentId]
    );
  } else {
    enrollmentQuery = await query(
      `SELECT e.*, 
        u.first_name, u.last_name, u.email,
        c.title as course_title, c.duration_weeks,
        t.name as school_name
       FROM enrollments e
       JOIN user_profiles u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       WHERE e.id = $1 AND c.tenant_id = $2`,
      [enrollmentId, tenantId]
    );
  }

  if (enrollmentQuery.rows.length === 0) {
    throw new NotFoundError('Enrollment not found');
  }

  const enrollment = enrollmentQuery.rows[0];

  // Check if course is completed
  if (enrollment.status !== 'completed') {
    throw new Error('Course must be completed to generate certificate');
  }

  // Check if certificate already exists
  const existingCert = await query(
    'SELECT id FROM certificates WHERE enrollment_id = $1',
    [enrollmentId]
  );

  if (existingCert.rows.length > 0) {
    // Return existing certificate
    return await getCertificateById(existingCert.rows[0].id, tenantId, isSuperAdmin);
  }

  // Generate certificate number
  const certNumber = `CERT-${Date.now()}-${enrollment.student_id.substring(0, 8).toUpperCase()}`;

  // Create certificate
  const result = await query(
    `INSERT INTO certificates (
      student_id, course_id, enrollment_id, 
      certificate_number, student_name, course_name, 
      issue_date, issued_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, CURRENT_TIMESTAMP)
    RETURNING *`,
    [
      enrollment.student_id,
      enrollment.course_id,
      enrollmentId,
      certNumber,
      `${enrollment.first_name} ${enrollment.last_name}`,
      enrollment.course_title,
    ]
  );

  return result.rows[0];
}

/**
 * Get certificate by ID
 */
export async function getCertificateById(certificateId, tenantId, isSuperAdmin = false) {
  let result;

  if (isSuperAdmin) {
    result = await query(
      `SELECT cert.*,
        u.first_name, u.last_name, u.email,
        c.title as course_title,
        t.name as school_name
       FROM certificates cert
       JOIN user_profiles u ON cert.student_id = u.id
       JOIN courses c ON cert.course_id = c.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       WHERE cert.id = $1`,
      [certificateId]
    );
  } else {
    result = await query(
      `SELECT cert.*,
        u.first_name, u.last_name, u.email,
        c.title as course_title,
        t.name as school_name
       FROM certificates cert
       JOIN user_profiles u ON cert.student_id = u.id
       JOIN courses c ON cert.course_id = c.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       WHERE cert.id = $1 AND u.tenant_id = $2`,
      [certificateId, tenantId]
    );
  }

  if (result.rows.length === 0) {
    throw new NotFoundError('Certificate not found');
  }

  return result.rows[0];
}

/**
 * Get all certificates for a student
 */
export async function getStudentCertificates(studentId, tenantId, isSuperAdmin = false) {
  let result;

  if (isSuperAdmin) {
    result = await query(
      `SELECT cert.*,
        c.title as course_title,
        t.name as school_name
       FROM certificates cert
       JOIN courses c ON cert.course_id = c.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       WHERE cert.student_id = $1
       ORDER BY cert.issued_at DESC`,
      [studentId]
    );
  } else {
    result = await query(
      `SELECT cert.*,
        c.title as course_title,
        t.name as school_name
       FROM certificates cert
       JOIN courses c ON cert.course_id = c.id
       JOIN user_profiles u ON cert.student_id = u.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       WHERE cert.student_id = $1 AND u.tenant_id = $2
       ORDER BY cert.issued_at DESC`,
      [studentId, tenantId]
    );
  }

  return result.rows;
}

export default {
  generateCertificate,
  getCertificateById,
  getStudentCertificates
};

