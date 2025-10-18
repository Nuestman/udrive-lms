// Quiz Service - Quiz and question management
import { query } from '../lib/db.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import progressService from './progress.service.js';

/**
 * Create quiz
 */
export async function createQuiz(quizData, tenantId, isSuperAdmin = false) {
  const {
    module_id,
    title,
    description,
    passing_score,
    // UI payload names
    time_limit,
    attempts_allowed,
    // Schema-aligned names (support either)
    time_limit_minutes,
    max_attempts,
    randomize_questions,
    randomize_answers,
    show_feedback,
    status,
  } = quizData;

  // Verify module access
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

  // Map UI fields to schema: time_limit -> time_limit_minutes, attempts_allowed -> max_attempts
  const mappedTimeLimit = (time_limit_minutes ?? time_limit) ?? null;
  const mappedMaxAttempts = (max_attempts ?? attempts_allowed) ?? null;

  const result = await query(
    `INSERT INTO quizzes (
        module_id, title, description, passing_score,
        time_limit_minutes, max_attempts,
        randomize_questions, randomize_answers,
        show_feedback, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      module_id,
      title,
      description,
      passing_score || 70,
      mappedTimeLimit,
      mappedMaxAttempts,
      randomize_questions ?? false,
      randomize_answers ?? false,
      show_feedback || 'immediate',
      status || 'draft',
    ]
  );

  return result.rows[0];
}

/**
 * Get quiz with questions
 */
export async function getQuizById(quizId, tenantId, isSuperAdmin = false, audience = '') {
  // Get quiz
  let quizQuery;
  if (isSuperAdmin) {
    quizQuery = await query(
      `SELECT q.*, m.title as module_title, c.title as course_title
       FROM quizzes q
       JOIN modules m ON q.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE q.id = $1`,
      [quizId]
    );
  } else {
    let text = `SELECT q.*, m.title as module_title, c.title as course_title
                FROM quizzes q
                JOIN modules m ON q.module_id = m.id
                JOIN courses c ON m.course_id = c.id
                WHERE q.id = $1 AND c.tenant_id = $2`;
    const params = [quizId, tenantId];
    if (audience === 'student') {
      text += " AND q.status = 'published'";
    }
    quizQuery = await query(text, params);
  }

  if (quizQuery.rows.length === 0) {
    throw new NotFoundError('Quiz not found');
  }

  const quiz = quizQuery.rows[0];

  // Get questions
  const questionsResult = await query(
    `SELECT * FROM quiz_questions 
     WHERE quiz_id = $1 
     ORDER BY order_index`,
    [quizId]
  );

  quiz.questions = questionsResult.rows;

  return quiz;
}

/**
 * Add question to quiz
 */
export async function addQuestion(quizId, questionData, tenantId, isSuperAdmin = false) {
  const { question_text, question_type, options, correct_answer, points } = questionData;

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

  // Get next order index
  const orderResult = await query(
    'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM quiz_questions WHERE quiz_id = $1',
    [quizId]
  );
  const orderIndex = orderResult.rows[0].next_order;

  const result = await query(
    `INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, order_index)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      quizId,
      question_text,
      question_type || 'multiple_choice',
      JSON.stringify(options || []),
      JSON.stringify(correct_answer),
      points || 1,
      orderIndex,
    ]
  );

  return result.rows[0];
}

/**
 * Submit quiz attempt
 */
export async function submitQuizAttempt(quizId, studentId, answers, tenantId, isSuperAdmin = false) {
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

  // Get quiz with questions
  const quiz = await getQuizById(quizId, tenantId, isSuperAdmin);

  // Auto-grade
  let score = 0;
  let totalPoints = 0;

  quiz.questions.forEach((question) => {
    totalPoints += question.points || 1;
    const studentAnswer = answers[question.id];
    
    if (studentAnswer === question.correct_answer) {
      score += question.points || 1;
    }
  });

  const percentageScore = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = percentageScore >= quiz.passing_score;

  // Save attempt
  const attemptResult = await query(
    `INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, time_spent_seconds, status, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [quizId, studentId, JSON.stringify(answers), score, 0, 'completed', new Date()] // time_spent_seconds to be implemented
  );

  // Note: We no longer automatically mark quizzes as complete
  // Users must explicitly mark quizzes as complete using the "Mark as Complete" button
  // This unifies the lesson and quiz completion experience
  let progressUpdate = null;

  return {
    ...attemptResult.rows[0],
    totalPoints,
    percentageScore,
    passed,
    passingScore: quiz.passing_score,
    progressUpdate
  };
}

/**
 * Get student's quiz attempts
 */
export async function getQuizAttempts(quizId, studentId, tenantId, isSuperAdmin = false) {
  // Verify access
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

  const result = await query(
    `SELECT * FROM quiz_attempts
     WHERE quiz_id = $1 AND student_id = $2
     ORDER BY created_at DESC`,
    [quizId, studentId]
  );

  return result.rows;
}

/**
 * List quizzes by module
 */
export async function listQuizzesByModule(moduleId, tenantId, isSuperAdmin = false) {
  let text = `SELECT q.*
              FROM quizzes q
              JOIN modules m ON q.module_id = m.id
              JOIN courses c ON m.course_id = c.id
              WHERE q.module_id = $1`;
  const params = [moduleId];
  if (!isSuperAdmin) {
    text += ' AND c.tenant_id = $2';
    params.push(tenantId);
  }
  text += ' ORDER BY q.created_at DESC';
  const result = await query(text, params);
  return result.rows;
}

/**
 * Update quiz
 */
export async function updateQuiz(quizId, updates, tenantId, isSuperAdmin = false) {
  // Verify access
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

  const {
    title,
    description,
    passing_score,
    time_limit_minutes,
    max_attempts,
    randomize_questions,
    randomize_answers,
    show_feedback,
    status,
  } = updates;

  const result = await query(
    `UPDATE quizzes
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         passing_score = COALESCE($4, passing_score),
         time_limit_minutes = COALESCE($5, time_limit_minutes),
         max_attempts = COALESCE($6, max_attempts),
         randomize_questions = COALESCE($7, randomize_questions),
         randomize_answers = COALESCE($8, randomize_answers),
         show_feedback = COALESCE($9, show_feedback),
         status = COALESCE($10, status),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [
      quizId,
      title,
      description,
      passing_score,
      time_limit_minutes,
      max_attempts,
      randomize_questions,
      randomize_answers,
      show_feedback,
      status,
    ]
  );

  return result.rows[0];
}

/**
 * Delete quiz
 */
export async function deleteQuiz(quizId, tenantId, isSuperAdmin = false) {
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
  await query('DELETE FROM quizzes WHERE id = $1', [quizId]);
  return { success: true };
}

/**
 * Update quiz question
 */
export async function updateQuestion(quizId, questionId, updates, tenantId, isSuperAdmin = false) {
  // Verify access
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

  const {
    question_text,
    question_type,
    options,
    correct_answer,
    points,
    explanation,
    order_index,
  } = updates;

  const result = await query(
    `UPDATE quiz_questions
     SET question_text = COALESCE($3, question_text),
         question_type = COALESCE($4, question_type),
         options = COALESCE($5::jsonb, options),
         correct_answer = COALESCE($6::jsonb, correct_answer),
         points = COALESCE($7, points),
         explanation = COALESCE($8, explanation),
         order_index = COALESCE($9, order_index),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND quiz_id = $1
     RETURNING *`,
    [
      quizId,
      questionId,
      question_text,
      question_type,
      options !== undefined ? JSON.stringify(options) : undefined,
      correct_answer !== undefined ? JSON.stringify(correct_answer) : undefined,
      points,
      explanation,
      order_index,
    ]
  );

  return result.rows[0];
}

/**
 * Delete quiz question
 */
export async function deleteQuestion(quizId, questionId, tenantId, isSuperAdmin = false) {
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

  await query('DELETE FROM quiz_questions WHERE id = $1 AND quiz_id = $2', [questionId, quizId]);
  return { success: true };
}

export default {
  createQuiz,
  getQuizById,
  addQuestion,
  submitQuizAttempt,
  getQuizAttempts,
  listQuizzesByModule,
  updateQuiz,
  deleteQuiz,
  updateQuestion,
  deleteQuestion
};

