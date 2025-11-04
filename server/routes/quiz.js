// Quiz Routes
import express from 'express';
import quizService from '../services/quiz.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(requireAuth);
router.use(tenantContext);

/**
 * POST /api/quizzes
 * Create new quiz
 */
router.post('/', asyncHandler(async (req, res) => {
  const quiz = await quizService.createQuiz(req.body, req.tenantId, req.isSuperAdmin, req.app.get('io'));
  
  res.status(201).json({
    success: true,
    data: quiz,
    message: 'Quiz created successfully'
  });
}));

/**
 * GET /api/quizzes/:id
 * Get quiz with questions
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const audience = (req.query.audience || '').toString();
  const quiz = await quizService.getQuizById(req.params.id, req.tenantId, req.isSuperAdmin, audience);
  
  res.json({
    success: true,
    data: quiz
  });
}));

/**
 * POST /api/quizzes/:id/questions
 * Add question to quiz
 */
router.post('/:id/questions', asyncHandler(async (req, res) => {
  const question = await quizService.addQuestion(req.params.id, req.body, req.tenantId, req.isSuperAdmin);
  
  res.status(201).json({
    success: true,
    data: question,
    message: 'Question added successfully'
  });
}));

/**
 * PUT /api/quizzes/:id/questions/:questionId
 * Update question
 */
router.put('/:id/questions/:questionId', asyncHandler(async (req, res) => {
  const updated = await quizService.updateQuestion(req.params.id, req.params.questionId, req.body, req.tenantId, req.isSuperAdmin);
  res.json({ success: true, data: updated, message: 'Question updated successfully' });
}));

/**
 * DELETE /api/quizzes/:id/questions/:questionId
 * Delete question
 */
router.delete('/:id/questions/:questionId', asyncHandler(async (req, res) => {
  await quizService.deleteQuestion(req.params.id, req.params.questionId, req.tenantId, req.isSuperAdmin);
  res.json({ success: true, message: 'Question deleted successfully' });
}));

/**
 * POST /api/quizzes/:id/submit
 * Submit quiz attempt
 */
router.post('/:id/submit', asyncHandler(async (req, res) => {
  const result = await quizService.submitQuizAttempt(
    req.params.id,
    req.user.id,
    req.body.answers,
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: result,
    message: result.passed ? 'Quiz passed!' : 'Quiz completed'
  });
}));

/**
 * GET /api/quizzes/:id/attempts
 * Get student's quiz attempts
 */
router.get('/:id/attempts', asyncHandler(async (req, res) => {
  const attempts = await quizService.getQuizAttempts(
    req.params.id,
    req.user.id,
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: attempts
  });
}));

/**
 * GET /api/quizzes/module/:moduleId
 * List quizzes for a module
 */
router.get('/module/:moduleId', asyncHandler(async (req, res) => {
  const quizzes = await quizService.listQuizzesByModule(req.params.moduleId, req.tenantId, req.isSuperAdmin);
  res.json({ success: true, data: quizzes });
}));

/**
 * PUT /api/quizzes/:id
 * Update a quiz
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const quiz = await quizService.updateQuiz(req.params.id, req.body, req.tenantId, req.isSuperAdmin, io);
  res.json({ success: true, data: quiz, message: 'Quiz updated successfully' });
}));

/**
 * DELETE /api/quizzes/:id
 * Delete a quiz
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await quizService.deleteQuiz(req.params.id, req.tenantId, req.isSuperAdmin);
  res.json({ success: true, message: 'Quiz deleted successfully' });
}));

export default router;

