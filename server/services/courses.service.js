// Courses Service - Business logic for course management
import { query } from '../lib/db.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { isEmailConfigured, sendTemplatedEmail } from '../utils/mailer.js';

/**
 * Get all courses
 * - Super Admin: All courses across all tenants (with school name)
 * - Others: Only courses from their tenant
 */
export async function getCourses(tenantId, isSuperAdmin = false) {
  // Super Admin: See all courses with tenant/school name
  if (isSuperAdmin) {
    const result = await query(
      `SELECT c.*, 
        p.first_name || ' ' || p.last_name as instructor_name,
        u.email as instructor_email,
        t.name as school_name,
        t.id as school_id,
        (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       ORDER BY c.created_at DESC`
    );
    return result.rows;
  }

  // Tenant-scoped: Only their courses
  const result = await query(
    `SELECT c.*, 
      p.first_name || ' ' || p.last_name as instructor_name,
      u.email as instructor_email,
      (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
     FROM courses c
     LEFT JOIN users u ON c.created_by = u.id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE c.tenant_id = $1
     ORDER BY c.created_at DESC`,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get single course by ID
 * - Super Admin: Any course from any tenant
 * - Others: Only if course belongs to their tenant
 */
export async function getCourseById(courseId, tenantId, isSuperAdmin = false) {
  let result;

  if (isSuperAdmin) {
    // Super Admin: Access any course
    result = await query(
      `SELECT c.*, 
        p.first_name || ' ' || p.last_name as instructor_name,
        u.email as instructor_email,
        t.name as school_name,
        (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN tenants t ON c.tenant_id = t.id
       WHERE c.id = $1`,
      [courseId]
    );
  } else {
    // Tenant-scoped: Only their course
    result = await query(
      `SELECT c.*, 
        p.first_name || ' ' || p.last_name as instructor_name,
        u.email as instructor_email,
        (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE c.id = $1 AND c.tenant_id = $2`,
      [courseId, tenantId]
    );
  }

  if (result.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }

  return result.rows[0];
}

/**
 * Get single course by slug (tenant-scoped)
 */
export async function getCourseBySlug(slug, tenantId) {
  const result = await query(
    `SELECT c.*, 
      p.first_name || ' ' || p.last_name as instructor_name,
      u.email as instructor_email,
      (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
     FROM courses c
     LEFT JOIN users u ON c.created_by = u.id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE c.slug = $1 AND c.tenant_id = $2`,
    [slug, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }

  return result.rows[0];
}

/**
 * Get course with modules and lessons
 */
export async function getCourseWithContent(courseId, tenantId) {
  const course = await getCourseById(courseId, tenantId);

  // Get modules
  const modulesResult = await query(
    `SELECT m.*,
      (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count
     FROM modules m
     WHERE m.course_id = $1
     ORDER BY m.order_index`,
    [courseId]
  );

  // For each module, get lessons
  const modules = await Promise.all(
    modulesResult.rows.map(async (module) => {
      const lessonsResult = await query(
        `SELECT id, title, description, order_index, duration_minutes, status
         FROM lessons
         WHERE module_id = $1
         ORDER BY order_index`,
        [module.id]
      );

      return {
        ...module,
        lessons: lessonsResult.rows
      };
    })
  );

  return {
    ...course,
    modules
  };
}

/**
 * Create new course
 */
export async function createCourse(courseData, user) {
  const { title, description, thumbnail_url, duration_weeks, price } = courseData;

  // Validation
  if (!title || title.trim().length === 0) {
    throw new ValidationError('Course title is required');
  }

  if (title.length > 200) {
    throw new ValidationError('Course title must be less than 200 characters');
  }

  // Generate slug from title (lowercase, kebab-case). Uniqueness per tenant enforced by unique index.
  const baseSlug = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  let slug = baseSlug;
  let counter = 1;
  // Ensure uniqueness within tenant
  while (true) {
    const existing = await query('SELECT 1 FROM courses WHERE tenant_id = $1 AND slug = $2', [user.tenant_id, slug]);
    if (existing.rows.length === 0) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const result = await query(
    `INSERT INTO courses (tenant_id, slug, title, description, thumbnail_url, status, duration_weeks, price, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [user.tenant_id, slug, title, description || null, thumbnail_url || null, 'draft', duration_weeks || null, price || 0, user.id]
  );

  return result.rows[0];
}

/**
 * Update course
 */
export async function updateCourse(courseId, courseData, user, io = null) {
  const { title, description, thumbnail_url, duration_weeks, price, status } = courseData;

  // Get current course data for comparison
  const currentCourse = await getCourseById(courseId, user.tenant_id);
  const previousStatus = currentCourse.status;

  // Build dynamic update query
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    if (!title || title.trim().length === 0) {
      throw new ValidationError('Course title cannot be empty');
    }
    updates.push(`title = $${paramIndex++}`);
    values.push(title);

    // If title changes and no explicit slug provided in future, we keep existing slug.
  }

  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(description);
  }

  if (thumbnail_url !== undefined) {
    updates.push(`thumbnail_url = $${paramIndex++}`);
    values.push(thumbnail_url);
  }

  if (duration_weeks !== undefined) {
    updates.push(`duration_weeks = $${paramIndex++}`);
    values.push(duration_weeks);
  }

  if (price !== undefined) {
    updates.push(`price = $${paramIndex++}`);
    values.push(price);
  }

  if (status !== undefined) {
    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new ValidationError('Invalid course status');
    }
    updates.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (updates.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(courseId, user.tenant_id);

  const result = await query(
    `UPDATE courses 
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }

  const updatedCourse = result.rows[0];

  // Send notifications for course updates
  if (io) {
    try {
      const { notifyEnrolledStudents } = await import('./notifications.service.js');
      
      // Determine notification type and content
      let notificationType = 'course_update';
      let notificationTitle = 'Course Updated';
      let notificationMessage = `The course "${updatedCourse.title}" has been updated.`;
      let updateDetails = '';

      // Check what was updated
      const changes = [];
      if (title !== undefined && title !== currentCourse.title) {
        changes.push('title');
      }
      if (description !== undefined && description !== currentCourse.description) {
        changes.push('description');
      }
      if (thumbnail_url !== undefined && thumbnail_url !== currentCourse.thumbnail_url) {
        changes.push('thumbnail');
      }
      if (duration_weeks !== undefined && duration_weeks !== currentCourse.duration_weeks) {
        changes.push('duration');
      }
      if (price !== undefined && price !== currentCourse.price) {
        changes.push('price');
      }

      // Handle status changes
      if (status !== undefined && status !== previousStatus) {
        if (status === 'published' && previousStatus === 'draft') {
          notificationType = 'course_published';
          notificationTitle = 'New Course Available';
          notificationMessage = `The course "${updatedCourse.title}" is now available for you to start.`;
        } else {
          changes.push(`status (${previousStatus} → ${status})`);
        }
      }

      if (changes.length > 0) {
        updateDetails = `Updated: ${changes.join(', ')}`;
      }

      // Create notification data
      const notificationData = {
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        link: `/courses/${courseId}`,
        data: {
          courseId,
          courseName: updatedCourse.title,
          changes: changes
        },
        emailData: {
          courseName: updatedCourse.title,
          courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/courses/${courseId}`,
          updateDetails: updateDetails
        }
      };

      // Notify enrolled students
      await notifyEnrolledStudents(courseId, notificationData, io);
      
      console.log(`Course update notifications sent for course ${courseId}`);
    } catch (error) {
      console.error('Error sending course update notifications:', error);
      // Don't fail the course update if notifications fail
    }
  }

  return updatedCourse;
}

/**
 * Delete course
 */
export async function deleteCourse(courseId, tenantId) {
  // Check if course has enrollments
  const enrollmentCheck = await query(
    'SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1',
    [courseId]
  );

  if (parseInt(enrollmentCheck.rows[0].count) > 0) {
    throw new ValidationError('Cannot delete course with active enrollments');
  }

  const result = await query(
    'DELETE FROM courses WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [courseId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }

  return { success: true, id: result.rows[0].id };
}

/**
 * Publish course (change status to published)
 */
export async function publishCourse(courseId, user) {
  // Verify course has content
  const modulesCheck = await query(
    'SELECT COUNT(*) as count FROM modules WHERE course_id = $1',
    [courseId]
  );

  if (parseInt(modulesCheck.rows[0].count) === 0) {
    throw new ValidationError('Cannot publish course without modules');
  }

  const updatedCourse = await updateCourse(courseId, { status: 'published' }, user);

  // Email all active students in tenant that a new course is available
  try {
    const students = await query(
      `SELECT u.email, p.first_name
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.tenant_id = $1 AND u.role = 'student' AND u.is_active = true`,
      [user.tenant_id]
    );

    const emailEnabled = isEmailConfigured();
    const courseUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/courses/${updatedCourse.id}`;
    if (emailEnabled) {
      for (const s of students.rows) {
        if (!s.email) continue;
        await sendTemplatedEmail('course_added_school', {
          to: s.email,
          variables: {
            firstName: s.first_name,
            courseName: updatedCourse.title,
            courseUrl
          }
        });
      }
    }
  } catch (e) {
    console.error('Course publish tenant-wide email error:', e?.message || e);
  }

  return updatedCourse;
}

/**
 * Get course statistics
 */
export async function getCourseStats(courseId, tenantId) {
  const stats = await query(
    `SELECT 
      (SELECT COUNT(*) FROM enrollments WHERE course_id = $1) as total_enrollments,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'completed') as completions,
      (SELECT COUNT(*) FROM modules WHERE course_id = $1) as total_modules,
      (SELECT COUNT(*) FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = $1)) as total_lessons,
      (SELECT AVG(progress_percentage) FROM enrollments WHERE course_id = $1) as avg_progress
     FROM courses
     WHERE id = $1 AND tenant_id = $2`,
    [courseId, tenantId]
  );

  if (stats.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }

  return stats.rows[0];
}

export default {
  getCourses,
  getCourseById,
  getCourseBySlug,
  getCourseWithContent,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  getCourseStats
};

