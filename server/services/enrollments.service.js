// Enrollments Service - Business logic for course enrollments
import { query } from '../lib/db.js';
import { sendTemplatedEmail, isEmailConfigured } from '../utils/mailer.js';
import { buildNotification } from '../utils/notificationTemplates.js';
import notificationsService from './notifications.service.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Get all enrollments (with filters)
 * - Super Admin: All enrollments from all schools
 * - Others: Only their school's enrollments
 */
export async function getEnrollments(tenantId, filters = {}, isSuperAdmin = false) {
  let queryText = `
    SELECT e.*,
      p.first_name || ' ' || p.last_name as student_name,
      u.email as student_email,
      c.title as course_title,
      c.status as course_status
  `;

  // Super Admin: Include school name
  if (isSuperAdmin) {
    queryText += `, t.name as school_name
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN tenants t ON c.tenant_id = t.id
    WHERE 1=1
  `;
  } else {
    // Tenant-scoped: Only their enrollments
    queryText += `
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    JOIN courses c ON e.course_id = c.id
    WHERE c.tenant_id = $1
  `;
  }

  const params = isSuperAdmin ? [] : [tenantId];
  let paramIndex = params.length + 1;

  if (filters.student_id) {
    queryText += ` AND e.student_id = $${paramIndex}`;
    params.push(filters.student_id);
    paramIndex++;
  }

  if (filters.course_id) {
    queryText += ` AND e.course_id = $${paramIndex}`;
    params.push(filters.course_id);
    paramIndex++;
  }

  if (filters.status && filters.status !== 'all') {
    queryText += ` AND e.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  queryText += ` ORDER BY e.enrolled_at DESC`;

  const result = await query(queryText, params);
  return result.rows;
}

/**
 * Get enrollments for a student
 */
export async function getStudentEnrollments(studentId, tenantId) {
  const result = await query(
    `SELECT e.*,
      c.title as course_title,
      c.description as course_description,
      c.thumbnail_url,
      c.duration_weeks,
      (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as total_modules,
      (SELECT COUNT(*) FROM lessons l 
       JOIN modules m ON l.module_id = m.id 
       WHERE m.course_id = c.id) as total_lessons,
      (SELECT COUNT(*) FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = c.id AND lp.student_id = e.student_id AND lp.status = 'completed') as completed_lessons
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     JOIN users u ON e.student_id = u.id
     WHERE e.student_id = $1 AND u.tenant_id = $2
     ORDER BY e.enrolled_at DESC`,
    [studentId, tenantId]
  );

  return result.rows;
}

/**
 * Enroll student in course
 */
export async function enrollStudent(enrollmentData, tenantId, io = null) {
  const { student_id, course_id } = enrollmentData;

  // Validation
  if (!student_id || !course_id) {
    throw new ValidationError('Student ID and Course ID are required');
  }

  // Verify user exists and belongs to tenant (any role can enroll as student)
  const studentCheck = await query(
    'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
    [student_id, tenantId]
  );

  if (studentCheck.rows.length === 0) {
    throw new NotFoundError('Student not found');
  }

  // Verify course exists and belongs to tenant
  const courseCheck = await query(
    'SELECT id, status FROM courses WHERE id = $1 AND tenant_id = $2',
    [course_id, tenantId]
  );

  if (courseCheck.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }

  // Check if already enrolled
  const existingEnrollment = await query(
    'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
    [student_id, course_id]
  );

  if (existingEnrollment.rows.length > 0) {
    throw new ValidationError('Student is already enrolled in this course');
  }

  // Create enrollment
  const result = await query(
    `INSERT INTO enrollments (student_id, course_id, status, enrolled_at, progress_percentage)
     VALUES ($1, $2, 'active', NOW(), 0)
     RETURNING *`,
    [student_id, course_id]
  );
  const enrollment = result.rows[0];

  // Fetch student email and name + course title for notifications
  const details = await query(
    `SELECT u.email, p.first_name, c.title as course_title
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     JOIN courses c ON c.id = $1
     WHERE u.id = $2`,
    [course_id, student_id]
  );
  const info = details.rows[0] || {};

  // In-app notification
  try {
    const notif = buildNotification('enrollment_created', {
      courseName: info.course_title,
      link: `/courses/${course_id}`
    });
    await notificationsService.createNotification(student_id, {
      type: 'enrollment_created',
      title: notif.title,
      message: notif.body,
      link: notif.link
    }, io);
  } catch (e) {
    console.error('Enrollment notification error:', e?.message || e);
  }

  // Email notification
  if (isEmailConfigured() && info.email) {
    try {
      await sendTemplatedEmail('enrollment_created', {
        to: info.email,
        variables: {
          firstName: info.first_name,
          courseName: info.course_title,
          courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/courses/${course_id}`
        }
      });
    } catch (e) {
      console.error('Enrollment email error:', e?.message || e);
    }
  }

  return enrollment;
}

/**
 * Update enrollment status
 */
export async function updateEnrollmentStatus(enrollmentId, status, tenantId) {
  const validStatuses = ['pending', 'active', 'completed', 'suspended'];
  
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid enrollment status');
  }

  const result = await query(
    `UPDATE enrollments e
     SET status = $1, updated_at = NOW()
     FROM courses c
     WHERE e.id = $2 AND e.course_id = c.id AND c.tenant_id = $3
     RETURNING e.*`,
    [status, enrollmentId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Enrollment not found');
  }

  return result.rows[0];
}

/**
 * Update enrollment progress
 */
export async function updateEnrollmentProgress(enrollmentId, progressPercentage, tenantId) {
  if (progressPercentage < 0 || progressPercentage > 100) {
    throw new ValidationError('Progress must be between 0 and 100');
  }

  const result = await query(
    `UPDATE enrollments e
     SET progress_percentage = $1, 
         last_accessed_at = NOW(),
         ${progressPercentage >= 100 ? 'completed_at = NOW(),' : ''}
         ${progressPercentage >= 100 ? 'status = \'completed\',' : ''}
         updated_at = NOW()
     FROM courses c
     WHERE e.id = $2 AND e.course_id = c.id AND c.tenant_id = $3
     RETURNING e.*`,
    [progressPercentage, enrollmentId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Enrollment not found');
  }

  return result.rows[0];
}

/**
 * Unenroll student
 */
export async function unenrollStudent(enrollmentId, tenantId) {
  const result = await query(
    `DELETE FROM enrollments e
     USING courses c
     WHERE e.id = $1 AND e.course_id = c.id AND c.tenant_id = $2
     RETURNING e.id`,
    [enrollmentId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Enrollment not found');
  }

  return { success: true };
}

export default {
  getEnrollments,
  getStudentEnrollments,
  enrollStudent,
  updateEnrollmentStatus,
  updateEnrollmentProgress,
  unenrollStudent
};

