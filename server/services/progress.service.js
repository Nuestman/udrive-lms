// Progress Tracking Service - Student progress management
import { query } from '../lib/db.js';

/**
 * Get student's overall progress
 */
export async function getStudentProgress(studentId, tenantId, isSuperAdmin = false) {
  // Verify student access
  if (!isSuperAdmin) {
    const studentCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
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
      (SELECT COUNT(*) FROM quizzes WHERE module_id = m.id AND status = 'published') as total_quizzes,
      (SELECT COUNT(*) FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE q.module_id = m.id AND qa.student_id = $2 AND qa.status = 'completed') as completed_quizzes,
      (SELECT json_agg(json_build_object(
        'lesson_id', l.id,
        'lesson_title', l.title,
        'order_index', l.order_index,
        'type', 'lesson',
        'completed', EXISTS(SELECT 1 FROM lesson_progress WHERE lesson_id = l.id AND student_id = $2 AND status = 'completed'),
        'completed_at', (SELECT completed_at FROM lesson_progress WHERE lesson_id = l.id AND student_id = $2)
      ) ORDER BY l.order_index)
       FROM lessons l WHERE l.module_id = m.id) as lessons,
      (SELECT json_agg(json_build_object(
        'quiz_id', q.id,
        'quiz_title', q.title,
        'order_index', 999, -- Quizzes come after lessons
        'type', 'quiz',
        'completed', EXISTS(SELECT 1 FROM quiz_attempts WHERE quiz_id = q.id AND student_id = $2 AND status = 'completed'),
        'completed_at', (SELECT completed_at FROM quiz_attempts WHERE quiz_id = q.id AND student_id = $2)
      ) ORDER BY q.created_at)
       FROM quizzes q WHERE q.module_id = m.id AND q.status = 'published') as quizzes
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
 * Mark quiz as completed and update progress
 */
export async function markQuizComplete(quizId, studentId, tenantId, isSuperAdmin = false) {
  console.log(`✅ Marking quiz ${quizId} as complete for student ${studentId}`);
  
  // Verify quiz access
  if (!isSuperAdmin) {
    const quizCheck = await query(
      `SELECT q.id FROM quizzes q
       JOIN modules m ON q.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE q.id = $1 AND c.tenant_id = $2`,
      [quizId, tenantId]
    );
    
    if (quizCheck.rows.length === 0) {
      throw new Error('Quiz not found or access denied');
    }
  }

  // Get the module_id from the quiz for progress calculation
  const quizInfoResult = await query(
    `SELECT c.id as course_id, m.id as module_id
     FROM courses c
     JOIN modules m ON m.course_id = c.id
     JOIN quizzes q ON q.module_id = m.id
     WHERE q.id = $1`,
    [quizId]
  );

  if (quizInfoResult.rows.length === 0) return;

  const { course_id: courseId, module_id: moduleId } = quizInfoResult.rows[0];

  // Update progress (this will recalculate module and course completion)
  const enrollmentUpdate = await updateEnrollmentProgress(quizId, studentId, courseId, moduleId);
  
  return {
    success: true,
    enrollment_progress: enrollmentUpdate
  };
}

/**
 * Update enrollment progress based on completed content (lessons or quizzes)
 */
async function updateEnrollmentProgress(contentId, studentId, courseId = null, moduleId = null, lessonId = null) {
  // If courseId and moduleId are not provided, get them from the content
  if (!courseId || !moduleId || !lessonId) {
    // Try to get from lesson first, then from quiz
    let infoResult = await query(
      `SELECT c.id as course_id, m.id as module_id
       FROM courses c
       JOIN modules m ON m.course_id = c.id
       JOIN lessons l ON l.module_id = m.id
       WHERE l.id = $1`,
      [contentId]
    );

    if (infoResult.rows.length === 0) {
      // Try quiz
      infoResult = await query(
        `SELECT c.id as course_id, m.id as module_id
         FROM courses c
         JOIN modules m ON m.course_id = c.id
         JOIN quizzes q ON q.module_id = m.id
         WHERE q.id = $1`,
        [contentId]
      );
    }

    if (infoResult.rows.length === 0) return;

    courseId = infoResult.rows[0].course_id;
    moduleId = infoResult.rows[0].module_id;
    lessonId = infoResult.rows[0].lesson_id;
  }

  // Calculate progress including both lessons and quizzes
  const progressResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM lessons l 
       JOIN modules m ON l.module_id = m.id 
       WHERE m.course_id = $1) as total_lessons,
      (SELECT COUNT(*) FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = $1 AND lp.student_id = $2 AND lp.status = 'completed') as completed_lessons,
      (SELECT COUNT(*) FROM quizzes q 
       JOIN modules m ON q.module_id = m.id 
       WHERE m.course_id = $1 AND q.status = 'published') as total_quizzes,
      (SELECT COUNT(*) FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN modules m ON q.module_id = m.id
       WHERE m.course_id = $1 AND qa.student_id = $2 AND qa.status = 'completed') as completed_quizzes`,
    [courseId, studentId]
  );

  const { total_lessons, completed_lessons, total_quizzes, completed_quizzes } = progressResult.rows[0];
  const totalContent = parseInt(total_lessons) + parseInt(total_quizzes);
  const completedContent = parseInt(completed_lessons) + parseInt(completed_quizzes);
  const progressPercentage = totalContent > 0 
    ? Math.round((completedContent / totalContent) * 100) 
    : 0;

  // Check if module is completed (including both lessons and quizzes)
  const moduleProgressResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM lessons WHERE module_id = $1) as total_module_lessons,
      (SELECT COUNT(*) FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       WHERE l.module_id = $1 AND lp.student_id = $2 AND lp.status = 'completed') as completed_module_lessons,
      (SELECT COUNT(*) FROM quizzes WHERE module_id = $1 AND status = 'published') as total_module_quizzes,
      (SELECT COUNT(*) FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE q.module_id = $1 AND qa.student_id = $2 AND qa.status = 'completed') as completed_module_quizzes`,
    [moduleId, studentId]
  );

  const { total_module_lessons, completed_module_lessons, total_module_quizzes, completed_module_quizzes } = moduleProgressResult.rows[0];
  const totalModuleContent = parseInt(total_module_lessons) + parseInt(total_module_quizzes);
  const completedModuleContent = parseInt(completed_module_lessons) + parseInt(completed_module_quizzes);
  const moduleCompleted = totalModuleContent > 0 && completedModuleContent === totalModuleContent;

  // Check if course is completed
  const courseCompleted = progressPercentage >= 100;

  // Update enrollment
  await query(
    `UPDATE enrollments
     SET progress_percentage = $3,
         status = CASE 
           WHEN $3 >= 100 THEN 'completed'
           ELSE 'active'
         END,
         completed_at = CASE WHEN $3 >= 100 THEN CURRENT_TIMESTAMP ELSE NULL END,
         updated_at = CURRENT_TIMESTAMP
     WHERE course_id = $1 AND student_id = $2`,
    [courseId, studentId, progressPercentage]
  );

  console.log(`📊 Progress Updated: Course ${courseId}, Student ${studentId}`);
  console.log(`   Total Content: ${totalContent} (Lessons: ${total_lessons}, Quizzes: ${total_quizzes})`);
  console.log(`   Completed Content: ${completedContent} (Lessons: ${completed_lessons}, Quizzes: ${completed_quizzes})`);
  console.log(`   Progress: ${progressPercentage}%`);
  console.log(`   Module ${moduleId}: ${completedModuleContent}/${totalModuleContent} (L: ${completed_module_lessons}/${total_module_lessons}, Q: ${completed_module_quizzes}/${total_module_quizzes}) - ${moduleCompleted ? '✅ COMPLETE' : 'In Progress'}`);
  console.log(`   Course: ${courseCompleted ? '🎉 COMPLETE!' : 'In Progress'}`);

  return { 
    progressPercentage, 
    totalLessons: total_lessons, 
    completedLessons: completed_lessons,
    totalQuizzes: total_quizzes,
    completedQuizzes: completed_quizzes,
    totalContent,
    completedContent,
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

/**
 * Check if a quiz is completed by a student
 */
export async function isQuizCompleted(quizId, studentId, tenantId, isSuperAdmin = false) {
  // Verify quiz access
  if (!isSuperAdmin) {
    const quizCheck = await query(
      `SELECT q.id FROM quizzes q
       JOIN modules m ON q.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE q.id = $1 AND c.tenant_id = $2`,
      [quizId, tenantId]
    );
    
    if (quizCheck.rows.length === 0) {
      throw new Error('Quiz not found or access denied');
    }
  }

  // Check if student has completed the quiz (has a completed attempt)
  const result = await query(
    `SELECT id FROM quiz_attempts 
     WHERE quiz_id = $1 AND student_id = $2 AND status = 'completed'`,
    [quizId, studentId]
  );

  return result.rows.length > 0;
}

export default {
  getStudentProgress,
  getCourseProgress,
  markLessonComplete,
  markLessonIncomplete,
  markQuizComplete,
  isQuizCompleted
};

