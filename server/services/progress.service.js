// Progress Tracking Service - Student progress management
import { query } from '../lib/db.js';

/**
 * Get student's overall progress
 */
export async function getStudentProgress(studentId, tenantId, isSuperAdmin = false) {
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

  // Get all enrollments with progress
  const result = await query(
    `SELECT e.*,
      c.title as course_title,
      c.thumbnail_url,
      (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as total_modules,
      (SELECT COUNT(*) FROM lessons l 
       JOIN modules m ON l.module_id = m.id 
       WHERE m.course_id = c.id) as total_lessons,
      (SELECT COUNT(*) FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = c.id AND lp.student_id = e.student_id AND lp.status = 'completed') as completed_lessons
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.student_id = $1
     ORDER BY e.enrolled_at DESC`,
    [studentId]
  );

  return result.rows;
}

/**
 * Get progress for a specific course
 */
export async function getCourseProgress(courseId, studentId, tenantId, isSuperAdmin = false) {
  // Verify access
  if (!isSuperAdmin) {
    const enrollmentCheck = await query(
      `SELECT e.id FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.course_id = $1 AND e.student_id = $2 AND c.tenant_id = $3`,
      [courseId, studentId, tenantId]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      throw new Error('Enrollment not found or access denied');
    }
  }

  // Get detailed progress by module
  const result = await query(
    `SELECT m.id as module_id,
      m.title as module_title,
      m.order_index,
      (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as total_lessons,
      (SELECT COUNT(*) FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       WHERE l.module_id = m.id AND lp.student_id = $2 AND lp.status = 'completed') as completed_lessons,
      (SELECT json_agg(json_build_object(
        'lesson_id', l.id,
        'lesson_title', l.title,
        'order_index', l.order_index,
        'completed', EXISTS(SELECT 1 FROM lesson_progress WHERE lesson_id = l.id AND student_id = $2 AND status = 'completed'),
        'completed_at', (SELECT completed_at FROM lesson_progress WHERE lesson_id = l.id AND student_id = $2)
      ) ORDER BY l.order_index)
       FROM lessons l WHERE l.module_id = m.id) as lessons
     FROM modules m
     WHERE m.course_id = $1
     ORDER BY m.order_index`,
    [courseId, studentId]
  );

  return result.rows;
}

/**
 * Mark lesson as completed
 */
export async function markLessonComplete(lessonId, studentId, tenantId, isSuperAdmin = false) {
  console.log(`✅ Marking lesson ${lessonId} as complete for student ${studentId}`);
  
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

  // Check if already completed
  const existingProgress = await query(
    'SELECT id, status FROM lesson_progress WHERE lesson_id = $1 AND student_id = $2',
    [lessonId, studentId]
  );

  let progressRecord;

  if (existingProgress.rows.length > 0) {
    // Update existing record
    console.log(`   Updating existing progress record (status: ${existingProgress.rows[0].status})`);
    const updateResult = await query(
      `UPDATE lesson_progress
       SET status = 'completed',
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE lesson_id = $1 AND student_id = $2
       RETURNING *`,
      [lessonId, studentId]
    );
    progressRecord = updateResult.rows[0];
  } else {
    // Create new record
    console.log(`   Creating new progress record`);
    const insertResult = await query(
      `INSERT INTO lesson_progress (lesson_id, student_id, status, completed_at, started_at)
       VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [lessonId, studentId]
    );
    progressRecord = insertResult.rows[0];
  }

  console.log(`   ✅ Lesson marked as complete`);

  // Update enrollment progress percentage
  const enrollmentUpdate = await updateEnrollmentProgress(lessonId, studentId);
  
  return {
    ...progressRecord,
    enrollment_progress: enrollmentUpdate
  };
}

/**
 * Update enrollment progress based on completed lessons
 */
async function updateEnrollmentProgress(lessonId, studentId) {
  // Get course and module from lesson
  const lessonInfoResult = await query(
    `SELECT c.id as course_id, m.id as module_id, l.module_id as lesson_module_id
     FROM courses c
     JOIN modules m ON m.course_id = c.id
     JOIN lessons l ON l.module_id = m.id
     WHERE l.id = $1`,
    [lessonId]
  );

  if (lessonInfoResult.rows.length === 0) return;

  const { course_id: courseId, lesson_module_id: moduleId } = lessonInfoResult.rows[0];

  // Calculate progress
  const progressResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM lessons l 
       JOIN modules m ON l.module_id = m.id 
       WHERE m.course_id = $1) as total_lessons,
      (SELECT COUNT(*) FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = $1 AND lp.student_id = $2 AND lp.status = 'completed') as completed_lessons`,
    [courseId, studentId]
  );

  const { total_lessons, completed_lessons } = progressResult.rows[0];
  const progressPercentage = total_lessons > 0 
    ? Math.round((completed_lessons / total_lessons) * 100) 
    : 0;

  // Check if module is completed
  const moduleProgressResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM lessons WHERE module_id = $1) as total_module_lessons,
      (SELECT COUNT(*) FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       WHERE l.module_id = $1 AND lp.student_id = $2 AND lp.status = 'completed') as completed_module_lessons`,
    [moduleId, studentId]
  );

  const { total_module_lessons, completed_module_lessons } = moduleProgressResult.rows[0];
  const moduleCompleted = parseInt(total_module_lessons) > 0 && 
                          parseInt(completed_module_lessons) === parseInt(total_module_lessons);

  // Check if course is completed
  const courseCompleted = progressPercentage >= 100;

  // Update enrollment
  await query(
    `UPDATE enrollments
     SET progress_percentage = $3,
         status = CASE 
           WHEN $3 >= 100 THEN 'completed'
           WHEN $3 > 0 THEN 'active'
           ELSE 'enrolled'
         END,
         completed_at = CASE WHEN $3 >= 100 THEN CURRENT_TIMESTAMP ELSE NULL END,
         updated_at = CURRENT_TIMESTAMP
     WHERE course_id = $1 AND student_id = $2`,
    [courseId, studentId, progressPercentage]
  );

  console.log(`📊 Progress Updated: Course ${courseId}, Student ${studentId}`);
  console.log(`   Total Lessons: ${total_lessons}, Completed: ${completed_lessons}`);
  console.log(`   Progress: ${progressPercentage}%`);
  console.log(`   Module ${moduleId}: ${completed_module_lessons}/${total_module_lessons} - ${moduleCompleted ? '✅ COMPLETE' : 'In Progress'}`);
  console.log(`   Course: ${courseCompleted ? '🎉 COMPLETE!' : 'In Progress'}`);

  return { 
    progressPercentage, 
    totalLessons: total_lessons, 
    completedLessons: completed_lessons,
    moduleCompleted,
    courseCompleted,
    moduleId,
    courseId
  };
}

/**
 * Mark lesson as incomplete (undo completion)
 */
export async function markLessonIncomplete(lessonId, studentId, tenantId, isSuperAdmin = false) {
  console.log(`❌ Marking lesson ${lessonId} as incomplete for student ${studentId}`);
  
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

  // Update progress record
  const result = await query(
    `UPDATE lesson_progress
     SET status = 'not_started',
         completed_at = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE lesson_id = $1 AND student_id = $2
     RETURNING *`,
    [lessonId, studentId]
  );

  console.log(`   ❌ Lesson marked as incomplete`);

  // Update enrollment progress
  const enrollmentUpdate = await updateEnrollmentProgress(lessonId, studentId);

  return { 
    success: true,
    progress_record: result.rows[0],
    enrollment_progress: enrollmentUpdate
  };
}

export default {
  getStudentProgress,
  getCourseProgress,
  markLessonComplete,
  markLessonIncomplete
};

