// Quiz Service - Quiz and question management
import { query } from '../lib/db.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Create quiz
 */
export async function createQuiz(quizData, tenantId, isSuperAdmin = false) {
  const { module_id, title, description, passing_score, time_limit, attempts_allowed } = quizData;

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

  const result = await query(
    `INSERT INTO quizzes (module_id, title, description, passing_score, time_limit, attempts_allowed)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [module_id, title, description, passing_score || 70, time_limit, attempts_allowed || 3]
  );

  return result.rows[0];
}

/**
 * Get quiz with questions
 */
export async function getQuizById(quizId, tenantId, isSuperAdmin = false) {
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
    quizQuery = await query(
      `SELECT q.*, m.title as module_title, c.title as course_title
       FROM quizzes q
       JOIN modules m ON q.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE q.id = $1 AND c.tenant_id = $2`,
      [quizId, tenantId]
    );
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
    [quizId, question_text, question_type || 'multiple_choice', JSON.stringify(options || []), correct_answer, points || 1, orderIndex]
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
    `INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, percentage_score, passed, time_taken)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [quizId, studentId, JSON.stringify(answers), score, percentageScore, passed, 0] // time_taken to be implemented
  );

  return {
    ...attemptResult.rows[0],
    totalPoints,
    passingScore: quiz.passing_score
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
     ORDER BY attempted_at DESC`,
    [quizId, studentId]
  );

  return result.rows;
}

export default {
  createQuiz,
  getQuizById,
  addQuestion,
  submitQuizAttempt,
  getQuizAttempts
};

