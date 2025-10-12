// Goals Routes
import express from 'express';
import goalsService from '../services/goals.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);
router.use(tenantContext);

/**
 * GET /api/goals
 * Get student's goals (students see their own, admins can see any)
 */
router.get('/', asyncHandler(async (req, res) => {
  const studentId = req.query.student_id || req.user.id;
  
  const goals = await goalsService.getStudentGoals(studentId, req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: goals
  });
}));

/**
 * GET /api/goals/:id
 * Get specific goal
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const goal = await goalsService.getGoalById(req.params.id, req.user.id, req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: goal
  });
}));

/**
 * POST /api/goals
 * Create new goal
 */
router.post('/', asyncHandler(async (req, res) => {
  const goal = await goalsService.createGoal(req.body, req.user.id, req.tenantId, req.isSuperAdmin);
  
  res.status(201).json({
    success: true,
    data: goal,
    message: 'Goal created successfully'
  });
}));

/**
 * PUT /api/goals/:id
 * Update goal
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const goal = await goalsService.updateGoal(req.params.id, req.body, req.user.id, req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: goal,
    message: 'Goal updated successfully'
  });
}));

/**
 * DELETE /api/goals/:id
 * Delete goal
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await goalsService.deleteGoal(req.params.id, req.user.id, req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    message: 'Goal deleted successfully'
  });
}));

export default router;

