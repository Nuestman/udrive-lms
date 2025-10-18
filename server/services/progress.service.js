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
      (SELECT COUNT(*) FROM lesson_progress lp
       JOIN quizzes q ON lp.lesson_id = q.id
       WHERE q.module_id = m.id AND lp.student_id = $2 AND lp.status = 'completed') as completed_quizzes,
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
 * Get unified content progress for a specific course
 * This function combines lessons and quizzes into a single content array
 */
export async function getUnifiedCourseProgress(courseId, studentId, tenantId, isSuperAdmin = false) {
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

  // Get detailed progress by module with unified content
  const result = await query(
    `SELECT m.id as module_id,
      m.title as module_title,
      m.order_index,
      (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as total_lessons,
      (SELECT COUNT(*) FROM content_progress cp
       JOIN lessons l ON cp.content_id = l.id
       WHERE l.module_id = m.id AND cp.student_id = $2 AND cp.content_type = 'lesson' AND cp.status = 'completed') as completed_lessons,
      (SELECT COUNT(*) FROM quizzes WHERE module_id = m.id AND status = 'published') as total_quizzes,
      (SELECT COUNT(*) FROM content_progress cp
       JOIN quizzes q ON cp.content_id = q.id
       WHERE q.module_id = m.id AND cp.student_id = $2 AND cp.content_type = 'quiz' AND cp.status = 'completed') as completed_quizzes,
      -- Unified content array combining lessons and quizzes
      (
        SELECT json_agg(content_item ORDER BY content_item.order_index, content_item.created_at)
        FROM (
          -- Lessons
          SELECT 
            l.id as content_id,
            l.id as lesson_id,
            NULL as quiz_id,
            l.title as title,
            l.order_index,
            l.created_at,
            'lesson' as type,
            EXISTS(SELECT 1 FROM content_progress WHERE content_id = l.id AND student_id = $2 AND content_type = 'lesson' AND status = 'completed') as completed,
            (SELECT completed_at FROM content_progress WHERE content_id = l.id AND student_id = $2 AND content_type = 'lesson') as completed_at
          FROM lessons l 
          WHERE l.module_id = m.id
          
          UNION ALL
          
          -- Quizzes
          SELECT 
            q.id as content_id,
            NULL as lesson_id,
            q.id as quiz_id,
            q.title as title,
            999 as order_index, -- Quizzes come after lessons
            q.created_at,
            'quiz' as type,
            EXISTS(SELECT 1 FROM content_progress WHERE content_id = q.id AND student_id = $2 AND content_type = 'quiz' AND status = 'completed') as completed,
            (SELECT completed_at FROM content_progress WHERE content_id = q.id AND student_id = $2 AND content_type = 'quiz') as completed_at
          FROM quizzes q 
          WHERE q.module_id = m.id AND q.status = 'published'
        ) as content_item
      ) as content
     FROM modules m
     WHERE m.course_id = $1
     ORDER BY m.order_index`,
    [courseId, studentId]
  );

  return result.rows;
}

/**
 * Mark lesson or quiz as completed (unified function)
 */
export async function markLessonComplete(contentId, studentId, tenantId, isSuperAdmin = false) {
  console.log(`✅ Marking content ${contentId} as complete for student ${studentId}`);
  
  // First, determine if this is a lesson or quiz
  const contentCheck = await query(
    `SELECT 'lesson' as type, l.id, m.id as module_id, c.id as course_id
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     JOIN courses c ON m.course_id = c.id
     WHERE l.id = $1
     UNION ALL
     SELECT 'quiz' as type, q.id, m.id as module_id, c.id as course_id
     FROM quizzes q
     JOIN modules m ON q.module_id = m.id
     JOIN courses c ON m.course_id = c.id
     WHERE q.id = $1`,
    [contentId]
  );
  
  if (contentCheck.rows.length === 0) {
    throw new Error('Content not found');
  }
  
  const content = contentCheck.rows[0];
  const { type, module_id: moduleId, course_id: courseId } = content;
  
  // Verify access for non-super admins
  if (!isSuperAdmin) {
    const accessCheck = await query(
      `SELECT c.tenant_id FROM courses c WHERE c.id = $1`,
      [courseId]
    );
    
    if (accessCheck.rows.length === 0 || accessCheck.rows[0].tenant_id !== tenantId) {
      throw new Error('Content not found or access denied');
    }
  }

  // Check if already completed in content_progress table
  const existingProgress = await query(
    'SELECT id, status FROM content_progress WHERE content_id = $1 AND student_id = $2 AND content_type = $3',
    [contentId, studentId, type]
  );

  let progressRecord;

  if (existingProgress.rows.length > 0) {
    // Update existing record
    console.log(`   Updating existing progress record (status: ${existingProgress.rows[0].status})`);
    const updateResult = await query(
      `UPDATE content_progress
       SET status = 'completed',
           completed_at = CURRENT_TIMESTAMP
       WHERE content_id = $1 AND student_id = $2 AND content_type = $3
       RETURNING *`,
      [contentId, studentId, type]
    );
    progressRecord = updateResult.rows[0];
  } else {
    // Create new record
    console.log(`   Creating new progress record`);
    const insertResult = await query(
      `INSERT INTO content_progress (content_id, student_id, content_type, status, completed_at, started_at)
       VALUES ($1, $2, $3, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [contentId, studentId, type]
    );
    progressRecord = insertResult.rows[0];
  }

  console.log(`   ✅ ${type === 'quiz' ? 'Quiz' : 'Lesson'} marked as complete`);

  // Update enrollment progress percentage
  const enrollmentUpdate = await updateEnrollmentProgress(contentId, studentId, courseId, moduleId);
  
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

  // Calculate progress including both lessons and quizzes (unified approach)
  const progressResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM lessons l 
       JOIN modules m ON l.module_id = m.id 
       WHERE m.course_id = $1) as total_lessons,
      (SELECT COUNT(*) FROM quizzes q 
       JOIN modules m ON q.module_id = m.id 
       WHERE m.course_id = $1 AND q.status = 'published') as total_quizzes,
      (SELECT COUNT(*) FROM content_progress cp
       JOIN lessons l ON cp.content_id = l.id
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = $1 AND cp.student_id = $2 AND cp.content_type = 'lesson' AND cp.status = 'completed') as completed_lessons,
      (SELECT COUNT(*) FROM content_progress cp
       JOIN quizzes q ON cp.content_id = q.id
       JOIN modules m ON q.module_id = m.id
       WHERE m.course_id = $1 AND cp.student_id = $2 AND cp.content_type = 'quiz' AND cp.status = 'completed') as completed_quizzes`,
    [courseId, studentId]
  );

  const { total_lessons, total_quizzes, completed_lessons, completed_quizzes } = progressResult.rows[0];
  const totalContent = parseInt(total_lessons) + parseInt(total_quizzes);
  const completedContent = parseInt(completed_lessons) + parseInt(completed_quizzes);
  const progressPercentage = totalContent > 0 
    ? Math.round((completedContent / totalContent) * 100) 
    : 0;

  // Check if module is completed (including both lessons and quizzes - unified approach)
  const moduleProgressResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM lessons WHERE module_id = $1) as total_module_lessons,
      (SELECT COUNT(*) FROM quizzes WHERE module_id = $1 AND status = 'published') as total_module_quizzes,
      (SELECT COUNT(*) FROM content_progress cp
       JOIN lessons l ON cp.content_id = l.id
       WHERE l.module_id = $1 AND cp.student_id = $2 AND cp.content_type = 'lesson' AND cp.status = 'completed') as completed_module_lessons,
      (SELECT COUNT(*) FROM content_progress cp
       JOIN quizzes q ON cp.content_id = q.id
       WHERE q.module_id = $1 AND cp.student_id = $2 AND cp.content_type = 'quiz' AND cp.status = 'completed') as completed_module_quizzes`,
    [moduleId, studentId]
  );

  const { total_module_lessons, total_module_quizzes, completed_module_lessons, completed_module_quizzes } = moduleProgressResult.rows[0];
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
 * Mark lesson or quiz as incomplete (undo completion) - unified function
 */
export async function markLessonIncomplete(contentId, studentId, tenantId, isSuperAdmin = false) {
  console.log(`❌ Marking content ${contentId} as incomplete for student ${studentId}`);
  
  // First, determine if this is a lesson or quiz
  const contentCheck = await query(
    `SELECT 'lesson' as type, l.id, m.id as module_id, c.id as course_id
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     JOIN courses c ON m.course_id = c.id
     WHERE l.id = $1
     UNION ALL
     SELECT 'quiz' as type, q.id, m.id as module_id, c.id as course_id
     FROM quizzes q
     JOIN modules m ON q.module_id = m.id
     JOIN courses c ON m.course_id = c.id
     WHERE q.id = $1`,
    [contentId]
  );
  
  if (contentCheck.rows.length === 0) {
    throw new Error('Content not found');
  }
  
  const content = contentCheck.rows[0];
  const { type, module_id: moduleId, course_id: courseId } = content;
  
  // Verify access for non-super admins
  if (!isSuperAdmin) {
    const accessCheck = await query(
      `SELECT c.tenant_id FROM courses c WHERE c.id = $1`,
      [courseId]
    );
    
    if (accessCheck.rows.length === 0 || accessCheck.rows[0].tenant_id !== tenantId) {
      throw new Error('Content not found or access denied');
    }
  }

  // Update progress record in content_progress table
  const result = await query(
    `UPDATE content_progress
     SET status = 'not_started',
         completed_at = NULL
     WHERE content_id = $1 AND student_id = $2 AND content_type = $3
     RETURNING *`,
    [contentId, studentId, type]
  );

  console.log(`   ❌ ${type === 'quiz' ? 'Quiz' : 'Lesson'} marked as incomplete`);

  // Update enrollment progress
  const enrollmentUpdate = await updateEnrollmentProgress(contentId, studentId, courseId, moduleId);

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
  getUnifiedCourseProgress,
  markLessonComplete,
  markLessonIncomplete,
  markQuizComplete,
  isQuizCompleted
};

