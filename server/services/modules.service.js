// Modules Service - Business logic for module management
import { query } from '../lib/db.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Get all modules for a course
 * - Super Admin: Any course's modules
 * - Others: Only if course is in their school
 */
export async function getModulesByCourse(courseId, tenantId, isSuperAdmin = false) {
  // Verify course exists
  let courseCheck;
  if (isSuperAdmin && tenantId === null) {
    // Super admin: Verify course exists without tenant filter
    courseCheck = await query(
      'SELECT id FROM courses WHERE id = $1',
      [courseId]
    );
  } else {
    // Regular tenant-scoped check
    courseCheck = await query(
      'SELECT id FROM courses WHERE id = $1 AND tenant_id = $2',
      [courseId, tenantId]
    );
  }

    if (courseCheck.rows.length === 0) {
      throw new NotFoundError('Course not found');
  }

  const result = await query(
    `SELECT m.*,
      (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count,
      (SELECT COUNT(*) FROM quizzes WHERE module_id = m.id) as quiz_count
     FROM modules m
     WHERE m.course_id = $1
     ORDER BY m.order_index`,
    [courseId]
  );

  return result.rows;
}

/**
 * Get single module
 * - Super Admin: Any module from any school
 * - Others: Only if module's course is in their school
 */
export async function getModuleById(moduleId, tenantId, isSuperAdmin = false) {
  let result;

  if (isSuperAdmin) {
    // Super Admin: Access any module
    result = await query(
      `SELECT m.*,
        c.tenant_id,
        (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count,
        (SELECT COUNT(*) FROM quizzes WHERE module_id = m.id) as quiz_count
       FROM modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = $1`,
      [moduleId]
    );
  } else {
    // Tenant-scoped: Only their module
    result = await query(
      `SELECT m.*,
        c.tenant_id,
        (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count,
        (SELECT COUNT(*) FROM quizzes WHERE module_id = m.id) as quiz_count
       FROM modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = $1 AND c.tenant_id = $2`,
      [moduleId, tenantId]
    );
  }

  if (result.rows.length === 0) {
    throw new NotFoundError('Module not found');
  }

  return result.rows[0];
}

/**
 * Create new module
 */
export async function createModule(moduleData, tenantId) {
  const { course_id, title, description, estimated_duration_minutes } = moduleData;

  // Validate
  if (!title || title.trim().length === 0) {
    throw new ValidationError('Module title is required');
  }

  if (!course_id) {
    throw new ValidationError('Course ID is required');
  }

  // Verify course exists and belongs to tenant
  const courseCheck = await query(
    'SELECT id FROM courses WHERE id = $1 AND tenant_id = $2',
    [course_id, tenantId]
  );

  if (courseCheck.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }

  // Get next order index
  const orderResult = await query(
    'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM modules WHERE course_id = $1',
    [course_id]
  );

  const order_index = orderResult.rows[0].next_order;

  // Create module
  const result = await query(
    `INSERT INTO modules (course_id, title, description, order_index, estimated_duration_minutes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [course_id, title, description || null, order_index, estimated_duration_minutes || null]
  );

  return result.rows[0];
}

/**
 * Update module
 */
export async function updateModule(moduleId, moduleData, tenantId) {
  const { title, description, estimated_duration_minutes, order_index } = moduleData;

  // Get current module data for comparison
  const currentModule = await getModuleById(moduleId, tenantId);

  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    if (!title || title.trim().length === 0) {
      throw new ValidationError('Module title cannot be empty');
    }
    updates.push(`title = $${paramIndex++}`);
    values.push(title);
  }

  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(description);
  }

  if (estimated_duration_minutes !== undefined) {
    updates.push(`estimated_duration_minutes = $${paramIndex++}`);
    values.push(estimated_duration_minutes);
  }

  if (order_index !== undefined) {
    updates.push(`order_index = $${paramIndex++}`);
    values.push(order_index);
  }

  if (updates.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(moduleId);

  const result = await query(
    `UPDATE modules 
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  const updatedModule = result.rows[0];

  // Send notifications for module updates (via polling, not socket.io)
  try {
    const { notifyModuleStudents } = await import('./notifications.service.js');
    
    // Get course information for the notification
    const courseResult = await query(
      `SELECT c.id, c.title as course_title FROM courses c 
       JOIN modules m ON c.id = m.course_id 
       WHERE m.id = $1`,
      [moduleId]
    );
    
    if (courseResult.rows.length > 0) {
      const course = courseResult.rows[0];
      
      // Determine what was updated
      const changes = [];
      if (title !== undefined && title !== currentModule.title) {
        changes.push('title');
      }
      if (description !== undefined && description !== currentModule.description) {
        changes.push('description');
      }
      if (estimated_duration_minutes !== undefined && estimated_duration_minutes !== currentModule.estimated_duration_minutes) {
        changes.push('duration');
      }
      if (order_index !== undefined && order_index !== currentModule.order_index) {
        changes.push('order');
      }

      const updateDetails = changes.length > 0 ? `Updated: ${changes.join(', ')}` : '';

      // Create notification data
      const notificationData = {
        type: 'module_update',
        title: 'Module Updated',
        message: `The module "${updatedModule.title}" in course "${course.course_title}" has been updated.`,
        link: `/courses/${course.id}/modules/${moduleId}`,
        data: {
          moduleId,
          courseId: course.id,
          moduleName: updatedModule.title,
          courseName: course.course_title,
          changes: changes
        },
        emailData: {
          moduleName: updatedModule.title,
          courseName: course.course_title,
          moduleUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/courses/${course.id}/modules/${moduleId}`,
          updateDetails: updateDetails
        }
      };

      // Notify students enrolled in the course
      await notifyModuleStudents(moduleId, notificationData);
      
      console.log(`Module update notifications sent for module ${moduleId}`);
    }
  } catch (error) {
    console.error('Error sending module update notifications:', error);
    // Don't fail the module update if notifications fail
  }

  return updatedModule;
}

/**
 * Delete module
 */
export async function deleteModule(moduleId, tenantId) {
  // Verify module belongs to tenant
  await getModuleById(moduleId, tenantId);

  // Check if module has lessons
  const lessonCheck = await query(
    'SELECT COUNT(*) as count FROM lessons WHERE module_id = $1',
    [moduleId]
  );

  if (parseInt(lessonCheck.rows[0].count) > 0) {
    throw new ValidationError('Cannot delete module with existing lessons');
  }

  const result = await query(
    'DELETE FROM modules WHERE id = $1 RETURNING id',
    [moduleId]
  );

  return { success: true, id: result.rows[0].id };
}

/**
 * Reorder modules
 */
export async function reorderModules(courseId, moduleOrders, tenantId) {
  // Verify course belongs to tenant
  const courseCheck = await query(
    'SELECT id FROM courses WHERE id = $1 AND tenant_id = $2',
    [courseId, tenantId]
  );

  if (courseCheck.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }

  // Update each module's order
  for (const { moduleId, orderIndex } of moduleOrders) {
    await query(
      'UPDATE modules SET order_index = $1, updated_at = NOW() WHERE id = $2 AND course_id = $3',
      [orderIndex, moduleId, courseId]
    );
  }

  return { success: true };
}

export default {
  getModulesByCourse,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  reorderModules
};

