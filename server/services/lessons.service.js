// Lessons Service - Lesson management business logic
import { query } from '../lib/db.js';

/**
 * Get all lessons for a module
 * - Super Admin: Any module's lessons
 * - Others: Only if module is in their school
 */
export async function getLessonsByModule(moduleId, tenantId, isSuperAdmin = false) {
  let queryText = `SELECT l.*, 
    (SELECT COUNT(*) FROM lesson_progress WHERE lesson_id = l.id AND status = 'completed') as completion_count
   FROM lessons l
   JOIN modules m ON l.module_id = m.id
   JOIN courses c ON m.course_id = c.id
   WHERE l.module_id = $1`;

  const params = [moduleId];
  
  // Tenant filter for non-super admins
  if (!isSuperAdmin) {
    queryText += ' AND c.tenant_id = $2';
    params.push(tenantId);
  }
  
  queryText += ' ORDER BY l.order_index ASC';
  
  const result = await query(queryText, params);
  return result.rows;
}

/**
 * Get single lesson by ID
 * - Super Admin: Any lesson
 * - Others: Only if lesson is in their school
 */
export async function getLessonById(lessonId, tenantId, isSuperAdmin = false) {
  let queryText = `SELECT l.*, 
    m.title as module_title,
    c.title as course_title,
    (SELECT COUNT(*) FROM lesson_progress WHERE lesson_id = l.id AND status = 'completed') as completion_count
   FROM lessons l
   JOIN modules m ON l.module_id = m.id
   JOIN courses c ON m.course_id = c.id
   WHERE l.id = $1`;

  const params = [lessonId];
  
  if (!isSuperAdmin) {
    queryText += ' AND c.tenant_id = $2';
    params.push(tenantId);
  }
  
  const result = await query(queryText, params);
  
  if (result.rows.length === 0) {
    throw new Error('Lesson not found');
  }
  
  return result.rows[0];
}

/**
 * Create new lesson
 */
export async function createLesson(lessonData, tenantId, isSuperAdmin = false) {
  const { module_id, title, content, lesson_type, video_url, document_url, estimated_duration_minutes } = lessonData;
  
  // Verify module belongs to tenant (skip for super admin)
  if (!isSuperAdmin) {
    const moduleCheck = await query(
      `SELECT m.id FROM modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = $1 AND c.tenant_id = $2`,
      [module_id, tenantId]
    );
    
    if (moduleCheck.rows.length === 0) {
      throw new Error('Module not found or access denied');
    }
  }
  
  // Get next order index
  const orderResult = await query(
    'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM lessons WHERE module_id = $1',
    [module_id]
  );
  const orderIndex = orderResult.rows[0].next_order;
  
  // Convert content to JSON string if it's an object/array
  const contentValue = content 
    ? (typeof content === 'string' ? content : JSON.stringify(content))
    : '[]';
  
  const result = await query(
    `INSERT INTO lessons (module_id, title, content, lesson_type, video_url, document_url, estimated_duration_minutes, order_index)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)
     RETURNING *`,
    [module_id, title, contentValue, lesson_type || 'text', video_url || null, document_url || null, estimated_duration_minutes || null, orderIndex]
  );
  
  return result.rows[0];
}

/**
 * Update lesson
 * - Super Admin: Can update any lesson
 * - Others: Only if lesson is in their school
 */
export async function updateLesson(lessonId, lessonData, tenantId, isSuperAdmin = false) {
  const { title, content, lesson_type, video_url, document_url, estimated_duration_minutes } = lessonData;
  
  // Verify lesson access
  if (!isSuperAdmin) {
    const lessonCheck = await query(
      `SELECT l.id FROM lessons l
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = $1 AND c.tenant_id = $2`,
      [lessonId, tenantId]
    );
    
    if (lessonCheck.rows.length === 0) {
      throw new Error('Lesson not found or access denied');
    }
  }
  
  // Convert content to JSON string if it's an object/array (for JSONB column)
  const contentValue = content !== undefined 
    ? (typeof content === 'string' ? content : JSON.stringify(content))
    : undefined;

  const result = await query(
    `UPDATE lessons
     SET title = COALESCE($2, title),
         content = COALESCE($3::jsonb, content),
         lesson_type = COALESCE($4, lesson_type),
         video_url = COALESCE($5, video_url),
         document_url = COALESCE($6, document_url),
         estimated_duration_minutes = COALESCE($7, estimated_duration_minutes),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [lessonId, title, contentValue, lesson_type, video_url, document_url, estimated_duration_minutes]
  );
  
  return result.rows[0];
}

/**
 * Delete lesson
 * - Super Admin: Can delete any lesson
 * - Others: Only if lesson is in their school
 */
export async function deleteLesson(lessonId, tenantId, isSuperAdmin = false) {
  // Verify lesson access
  let lessonCheck;
  
  if (isSuperAdmin) {
    // Super Admin: Access any lesson
    lessonCheck = await query(
      `SELECT l.id, l.module_id FROM lessons l WHERE l.id = $1`,
      [lessonId]
    );
  } else {
    // Tenant-scoped: Only their lesson
    lessonCheck = await query(
      `SELECT l.id, l.module_id FROM lessons l
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = $1 AND c.tenant_id = $2`,
      [lessonId, tenantId]
    );
  }
  
  if (lessonCheck.rows.length === 0) {
    throw new Error('Lesson not found or access denied');
  }
  
  await query('DELETE FROM lessons WHERE id = $1', [lessonId]);
  
  // Reorder remaining lessons
  const moduleId = lessonCheck.rows[0].module_id;
  await query(
    `UPDATE lessons
     SET order_index = subquery.new_order
     FROM (
       SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) as new_order
       FROM lessons
       WHERE module_id = $1
     ) as subquery
     WHERE lessons.id = subquery.id`,
    [moduleId]
  );
  
  return { success: true };
}

/**
 * Reorder lessons within a module
 */
export async function reorderLessons(moduleId, lessonOrders, tenantId) {
  // Verify module belongs to tenant
  const moduleCheck = await query(
    `SELECT m.id FROM modules m
     JOIN courses c ON m.course_id = c.id
     WHERE m.id = $1 AND c.tenant_id = $2`,
    [moduleId, tenantId]
  );
  
  if (moduleCheck.rows.length === 0) {
    throw new Error('Module not found or access denied');
  }
  
  // Update order for each lesson
  for (const { lesson_id, order_index } of lessonOrders) {
    await query(
      'UPDATE lessons SET order_index = $1 WHERE id = $2 AND module_id = $3',
      [order_index, lesson_id, moduleId]
    );
  }
  
  return { success: true };
}

/**
 * Mark lesson as completed for a student
 */
export async function markLessonComplete(lessonId, studentId, tenantId) {
  // Verify lesson belongs to tenant
  const lessonCheck = await query(
    `SELECT l.id FROM lessons l
     JOIN modules m ON l.module_id = m.id
     JOIN courses c ON m.course_id = c.id
     WHERE l.id = $1 AND c.tenant_id = $2`,
    [lessonId, tenantId]
  );
  
  if (lessonCheck.rows.length === 0) {
    throw new Error('Lesson not found or access denied');
  }
  
  // Check if progress record exists
  const progressCheck = await query(
    'SELECT id, status FROM lesson_progress WHERE lesson_id = $1 AND student_id = $2',
    [lessonId, studentId]
  );
  
  if (progressCheck.rows.length > 0) {
    // Update existing record
    const result = await query(
      `UPDATE lesson_progress
       SET status = 'completed', 
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE lesson_id = $1 AND student_id = $2
       RETURNING *`,
      [lessonId, studentId]
    );
    return result.rows[0];
  } else {
    // Create new progress record
    const result = await query(
      `INSERT INTO lesson_progress (lesson_id, student_id, status, completed_at)
       VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP)
       RETURNING *`,
      [lessonId, studentId]
    );
    return result.rows[0];
  }
}

export default {
  getLessonsByModule,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  markLessonComplete
};

