// Certificate Service - Certificate generation and management with tenant isolation
import { query } from '../lib/db.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../middleware/errorHandler.js';
import { sendTemplatedEmail, isEmailConfigured } from '../utils/mailer.js';
import { buildNotification } from '../utils/notificationTemplates.js';
import notificationsService from './notifications.service.js';

/**
 * Generate certificate for completed course
 */
export async function generateCertificate(enrollmentId, tenantId, isSuperAdmin = false, userId = null) {
  // Get enrollment details with instructor information
  let enrollmentQuery;
  
  if (isSuperAdmin) {
    enrollmentQuery = await query(
      `SELECT e.*, 
        p.first_name, p.last_name, u.email,
        c.title as course_title, c.duration_weeks, c.created_by,
        t.name as school_name,
        inst_prof.first_name as instructor_first_name,
        inst_prof.last_name as instructor_last_name
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       LEFT JOIN users inst_user ON c.created_by = inst_user.id
       LEFT JOIN user_profiles inst_prof ON inst_user.id = inst_prof.user_id
       WHERE e.id = $1`,
      [enrollmentId]
    );
  } else {
    enrollmentQuery = await query(
      `SELECT e.*, 
        p.first_name, p.last_name, u.email,
        c.title as course_title, c.duration_weeks, c.created_by,
        t.name as school_name,
        inst_prof.first_name as instructor_first_name,
        inst_prof.last_name as instructor_last_name
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       LEFT JOIN users inst_user ON c.created_by = inst_user.id
       LEFT JOIN user_profiles inst_prof ON inst_user.id = inst_prof.user_id
       WHERE e.id = $1 AND c.tenant_id = $2`,
      [enrollmentId, tenantId]
    );
  }

  if (enrollmentQuery.rows.length === 0) {
    throw new NotFoundError('Enrollment not found');
  }

  const enrollment = enrollmentQuery.rows[0];

  // Check if user has access to this enrollment (for students)
  if (userId && enrollment.student_id !== userId) {
    throw new ForbiddenError('Access denied: Can only generate certificates for your own enrollments');
  }

  // Check if course is completed
  if (enrollment.status !== 'completed') {
    throw new ValidationError('Course must be completed to generate certificate');
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

  // Generate certificate number and verification code
  const certNumber = `CERT-${Date.now()}-${enrollment.student_id.substring(0, 8).toUpperCase()}`;
  const verificationCode = `VERIFY-${Date.now()}-${enrollment.student_id.substring(0, 8).toUpperCase()}`;

  // Create certificate with all required fields
  const result = await query(
    `INSERT INTO certificates (
      student_id, course_id, enrollment_id, tenant_id,
      certificate_number, verification_code, 
      student_name, course_name, school_name, instructor_name,
      issue_date, issued_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, CURRENT_TIMESTAMP)
    RETURNING *`,
    [
      enrollment.student_id,
      enrollment.course_id,
      enrollmentId,
      enrollment.tenant_id || tenantId,
      certNumber,
      verificationCode,
      `${enrollment.first_name || ''} ${enrollment.last_name || ''}`.trim(),
      enrollment.course_title,
      enrollment.school_name,
      `${enrollment.instructor_first_name || ''} ${enrollment.instructor_last_name || ''}`.trim() || 'Instructor'
    ]
  );
  const certificate = result.rows[0];

  // Notify student (email + in-app)
  try {
    // fetch student contact and course title
    const contact = await query(
      `SELECT u.email, p.first_name
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [enrollment.student_id]
    );
    const { email, first_name } = contact.rows[0] || {};

    const notif = buildNotification('course_completed', {
      courseName: enrollment.course_title,
      certificateLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/certificates/${certificate.id}`
    });
    await notificationsService.createNotification(enrollment.student_id, {
      type: 'course_completed',
      title: notif.title,
      message: notif.body,
      link: notif.link
    }, io);

    if (isEmailConfigured() && email) {
      await sendTemplatedEmail('course_completed_certificate', {
        to: email,
        variables: {
          firstName: first_name,
          courseName: enrollment.course_title,
          certificateUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/certificates/${certificate.id}`
        }
      });
    }
  } catch (e) {
    console.error('Certificate notification/email error:', e?.message || e);
  }

  return certificate;
}

/**
 * Get certificate by ID
 */
export async function getCertificateById(certificateId, tenantId, isSuperAdmin = false) {
  let result;

  if (isSuperAdmin && tenantId === null) {
    result = await query(
      `SELECT cert.*,
        p.first_name, p.last_name, u.email,
        c.title as course_title,
        t.name as school_name
       FROM certificates cert
       JOIN users u ON cert.student_id = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       JOIN courses c ON cert.course_id = c.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       WHERE cert.id = $1`,
      [certificateId]
    );
  } else {
    result = await query(
      `SELECT cert.*,
        p.first_name, p.last_name, u.email,
        c.title as course_title,
        t.name as school_name
       FROM certificates cert
       JOIN users u ON cert.student_id = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
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

  if (isSuperAdmin && tenantId === null) {
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
       JOIN users u ON cert.student_id = u.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       WHERE cert.student_id = $1 AND cert.tenant_id = $2
       ORDER BY cert.issued_at DESC`,
      [studentId, tenantId]
    );
  }

  return result.rows;
}

/**
 * Get all certificates for a tenant (admin/instructor view)
 */
export async function getAllCertificates(tenantId, filters = {}, isSuperAdmin = false) {
  let queryText = `
    SELECT cert.*,
      p.first_name, p.last_name, u.email,
      c.title as course_title,
      t.name as school_name
    FROM certificates cert
    JOIN users u ON cert.student_id = u.id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    JOIN courses c ON cert.course_id = c.id
    LEFT JOIN tenants t ON cert.tenant_id = t.id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // Tenant isolation (unless super admin)
  if (!isSuperAdmin) {
    queryText += ` AND cert.tenant_id = $${paramIndex}`;
    params.push(tenantId);
    paramIndex++;
  }

  // Apply filters
  if (filters.student_id) {
    queryText += ` AND cert.student_id = $${paramIndex}`;
    params.push(filters.student_id);
    paramIndex++;
  }

  if (filters.course_id) {
    queryText += ` AND cert.course_id = $${paramIndex}`;
    params.push(filters.course_id);
    paramIndex++;
  }

  if (filters.status && filters.status !== 'all') {
    queryText += ` AND cert.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.search) {
    queryText += ` AND (cert.student_name ILIKE $${paramIndex} OR cert.course_name ILIKE $${paramIndex} OR cert.certificate_number ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  queryText += ` ORDER BY cert.issued_at DESC`;

  // Add pagination
  if (filters.limit) {
    queryText += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;
  }

  if (filters.offset) {
    queryText += ` OFFSET $${paramIndex}`;
    params.push(filters.offset);
  }

  const result = await query(queryText, params);
  return result.rows;
}

/**
 * Update certificate status (approve/revoke)
 */
export async function updateCertificateStatus(certificateId, status, userId, tenantId, isSuperAdmin = false, notes = null) {
  // Verify certificate exists and user has access
  const certCheck = await getCertificateById(certificateId, tenantId, isSuperAdmin);
  
  if (!certCheck) {
    throw new NotFoundError('Certificate not found');
  }

  // Validate status
  const validStatuses = ['active', 'revoked'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid certificate status');
  }

  // Update certificate
  const result = await query(
    `UPDATE certificates 
     SET status = $1,
         ${status === 'revoked' ? 'revoked_by = $2, revoked_at = CURRENT_TIMESTAMP, revocation_reason = $4' : 'approved_by = $2, approved_at = CURRENT_TIMESTAMP, approval_notes = $4'},
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [status, userId, certificateId, notes]
  );

  return result.rows[0];
}

/**
 * Delete certificate (soft delete by revoking)
 */
export async function deleteCertificate(certificateId, userId, tenantId, isSuperAdmin = false, reason = 'Certificate deleted') {
  return await updateCertificateStatus(certificateId, 'revoked', userId, tenantId, isSuperAdmin, reason);
}

/**
 * Get certificate statistics for dashboard
 */
export async function getCertificateStats(tenantId, isSuperAdmin = false) {
  let queryText = `
    SELECT 
      COUNT(*) as total_certificates,
      COUNT(*) FILTER (WHERE status = 'active') as active_certificates,
      COUNT(*) FILTER (WHERE status = 'revoked') as revoked_certificates,
      COUNT(*) FILTER (WHERE issued_at >= CURRENT_DATE - INTERVAL '30 days') as certificates_last_30_days,
      COUNT(*) FILTER (WHERE issued_at >= CURRENT_DATE - INTERVAL '7 days') as certificates_last_7_days
    FROM certificates
    WHERE 1=1
  `;

  const params = [];

  // Tenant isolation (unless super admin)
  if (!isSuperAdmin) {
    queryText += ` AND tenant_id = $1`;
    params.push(tenantId);
  }

  const result = await query(queryText, params);
  return result.rows[0];
}

/**
 * Verify certificate by verification code (public access)
 */
export async function verifyCertificateByCode(verificationCode) {
  if (!verificationCode || verificationCode.trim() === '') {
    throw new NotFoundError('Verification code is required');
  }

  // Trim and clean the verification code
  const cleanCode = verificationCode.trim();
  
  console.log('Verifying certificate with code:', cleanCode);
  
  const result = await query(
    `SELECT cert.*,
      t.name as school_name,
      p.first_name, p.last_name, u.email as student_email,
      c.title as course_title
     FROM certificates cert
     LEFT JOIN tenants t ON cert.tenant_id = t.id
     LEFT JOIN users u ON cert.student_id = u.id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     LEFT JOIN courses c ON cert.course_id = c.id
     WHERE cert.verification_code = $1`,
    [cleanCode]
  );

  if (result.rows.length === 0) {
    console.log('No certificate found for verification code:', cleanCode);
    throw new NotFoundError('Certificate not found');
  }

  const certificate = result.rows[0];
  
  // Return formatted certificate data
  return {
    id: certificate.id,
    certificate_number: certificate.certificate_number,
    verification_code: certificate.verification_code,
    student_name: certificate.student_name || `${certificate.first_name || ''} ${certificate.last_name || ''}`.trim(),
    course_name: certificate.course_name || certificate.course_title,
    school_name: certificate.school_name || certificate.tenant_name,
    issued_at: certificate.issued_at,
    status: certificate.status,
    is_valid: certificate.status === 'active'
  };
}

/**
 * Get certificates for course completion check
 */
export async function getCertificatesForEnrollment(enrollmentId, tenantId, isSuperAdmin = false) {
  let result;

  if (isSuperAdmin && tenantId === null) {
    result = await query(
      `SELECT cert.*
       FROM certificates cert
       WHERE cert.enrollment_id = $1`,
      [enrollmentId]
    );
  } else {
    result = await query(
      `SELECT cert.*
       FROM certificates cert
       WHERE cert.enrollment_id = $1 AND cert.tenant_id = $2`,
      [enrollmentId, tenantId]
    );
  }

  return result.rows;
}

export default {
  generateCertificate,
  getCertificateById,
  getStudentCertificates,
  getAllCertificates,
  updateCertificateStatus,
  deleteCertificate,
  getCertificateStats,
  verifyCertificateByCode,
  getCertificatesForEnrollment
};

