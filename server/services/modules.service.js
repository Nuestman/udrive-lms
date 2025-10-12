// Modules Service - Business logic for module management
import { query } from '../lib/db.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Get all modules for a course
 * - Super Admin: Any course's modules
 * - Others: Only if course is in their school
 */
export async function getModulesByCourse(courseId, tenantId, isSuperAdmin = false) {
  // Verify course access
  if (!isSuperAdmin) {
    const courseCheck = await query(
      'SELECT id FROM courses WHERE id = $1 AND tenant_id = $2',
      [courseId, tenantId]
    );

    if (courseCheck.rows.length === 0) {
      throw new NotFoundError('Course not found');
    }
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

  // Verify module belongs to tenant
  await getModuleById(moduleId, tenantId);

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

  return result.rows[0];
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

