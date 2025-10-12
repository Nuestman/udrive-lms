// Goals Service - Student goal management
import { query } from '../lib/db.js';

/**
 * Get student's goals
 */
export async function getStudentGoals(studentId, tenantId, isSuperAdmin = false) {
  // Verify student access
  if (!isSuperAdmin) {
    const studentCheck = await query(
      'SELECT id FROM user_profiles WHERE id = $1 AND tenant_id = $2',
      [studentId, tenantId]
    );
    
    if (studentCheck.rows.length === 0) {
      throw new Error('Student not found or access denied');
    }
  }

  const result = await query(
    `SELECT g.*,
      c.title as course_title,
      c.thumbnail_url as course_thumbnail
     FROM goals g
     LEFT JOIN courses c ON g.course_id = c.id
     WHERE g.student_id = $1
     ORDER BY 
       CASE g.status
         WHEN 'in_progress' THEN 1
         WHEN 'completed' THEN 2
         WHEN 'cancelled' THEN 3
       END,
       g.target_date ASC NULLS LAST`,
    [studentId]
  );

  return result.rows;
}

/**
 * Get goal by ID
 */
export async function getGoalById(goalId, studentId, tenantId, isSuperAdmin = false) {
  let result;

  if (isSuperAdmin) {
    result = await query(
      `SELECT g.*,
        c.title as course_title
       FROM goals g
       LEFT JOIN courses c ON g.course_id = c.id
       WHERE g.id = $1`,
      [goalId]
    );
  } else {
    result = await query(
      `SELECT g.*,
        c.title as course_title
       FROM goals g
       LEFT JOIN courses c ON g.course_id = c.id
       JOIN user_profiles u ON g.student_id = u.id
       WHERE g.id = $1 AND g.student_id = $2 AND u.tenant_id = $3`,
      [goalId, studentId, tenantId]
    );
  }

  if (result.rows.length === 0) {
    throw new Error('Goal not found or access denied');
  }

  return result.rows[0];
}

/**
 * Create new goal
 */
export async function createGoal(goalData, studentId, tenantId, isSuperAdmin = false) {
  const { course_id, title, description, target_date } = goalData;

  // Verify student access
  if (!isSuperAdmin) {
    const studentCheck = await query(
      'SELECT id FROM user_profiles WHERE id = $1 AND tenant_id = $2',
      [studentId, tenantId]
    );
    
    if (studentCheck.rows.length === 0) {
      throw new Error('Student not found or access denied');
    }
  }

  // If course_id provided, verify enrollment
  if (course_id) {
    const enrollmentCheck = await query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, course_id]
    );

    if (enrollmentCheck.rows.length === 0) {
      throw new Error('You must be enrolled in the course to set a goal for it');
    }
  }

  const result = await query(
    `INSERT INTO goals (student_id, course_id, title, description, target_date, status, progress_percentage)
     VALUES ($1, $2, $3, $4, $5, 'in_progress', 0)
     RETURNING *`,
    [studentId, course_id, title, description, target_date]
  );

  return result.rows[0];
}

/**
 * Update goal
 */
export async function updateGoal(goalId, goalData, studentId, tenantId, isSuperAdmin = false) {
  const { title, description, target_date, status, progress_percentage } = goalData;

  // Verify goal ownership
  if (!isSuperAdmin) {
    const goalCheck = await query(
      `SELECT g.id FROM goals g
       JOIN user_profiles u ON g.student_id = u.id
       WHERE g.id = $1 AND g.student_id = $2 AND u.tenant_id = $3`,
      [goalId, studentId, tenantId]
    );

    if (goalCheck.rows.length === 0) {
      throw new Error('Goal not found or access denied');
    }
  }

  const result = await query(
    `UPDATE goals
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         target_date = COALESCE($4, target_date),
         status = COALESCE($5, status),
         progress_percentage = COALESCE($6, progress_percentage),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [goalId, title, description, target_date, status, progress_percentage]
  );

  return result.rows[0];
}

/**
 * Delete goal
 */
export async function deleteGoal(goalId, studentId, tenantId, isSuperAdmin = false) {
  // Verify goal ownership
  if (!isSuperAdmin) {
    const goalCheck = await query(
      `SELECT g.id FROM goals g
       JOIN user_profiles u ON g.student_id = u.id
       WHERE g.id = $1 AND g.student_id = $2 AND u.tenant_id = $3`,
      [goalId, studentId, tenantId]
    );

    if (goalCheck.rows.length === 0) {
      throw new Error('Goal not found or access denied');
    }
  }

  await query('DELETE FROM goals WHERE id = $1', [goalId]);

  return { success: true, message: 'Goal deleted' };
}

export default {
  getStudentGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal
};

