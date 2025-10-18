// Lessons Routes
import express from 'express';
import lessonsService from '../services/lessons.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(requireAuth);
router.use(tenantContext);

/**
 * GET /api/lessons/module/:moduleId
 * Get all lessons in a module
 * - Super Admin: Any module's lessons
 * - Others: Only if module is in their school
 */
router.get('/module/:moduleId', asyncHandler(async (req, res) => {
  const audience = (req.query.audience || '').toString();
  const lessons = await lessonsService.getLessonsByModule(
    req.params.moduleId,
    req.tenantId,
    req.isSuperAdmin,
    audience
  );
  
  res.json({
    success: true,
    data: lessons
  });
}));

/**
 * GET /api/lessons/:id
 * Get single lesson
 * - Super Admin: Any lesson
 * - Others: Only if in their school
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const lesson = await lessonsService.getLessonById(req.params.id, req.tenantId, req.isSuperAdmin);
  res.json({ success: true, data: lesson });
}));

/**
 * POST /api/lessons
 * Create new lesson
 */
router.post('/', asyncHandler(async (req, res) => {
  const lesson = await lessonsService.createLesson(req.body, req.tenantId, req.isSuperAdmin);
  
  res.status(201).json({
    success: true,
    data: lesson,
    message: 'Lesson created successfully'
  });
}));

/**
 * PUT /api/lessons/:id
 * Update lesson
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const lesson = await lessonsService.updateLesson(req.params.id, req.body, req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: lesson,
    message: 'Lesson updated successfully'
  });
}));

/**
 * DELETE /api/lessons/:id
 * Delete lesson
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await lessonsService.deleteLesson(req.params.id, req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    message: 'Lesson deleted successfully'
  });
}));

/**
 * POST /api/lessons/module/:moduleId/reorder
 * Reorder lessons
 */
router.post('/module/:moduleId/reorder', asyncHandler(async (req, res) => {
  await lessonsService.reorderLessons(req.params.moduleId, req.body.lessonOrders, req.tenantId);
  
  res.json({
    success: true,
    message: 'Lessons reordered successfully'
  });
}));

/**
 * POST /api/lessons/:id/complete
 * Mark lesson as completed
 */
router.post('/:id/complete', asyncHandler(async (req, res) => {
  const progress = await lessonsService.markLessonComplete(req.params.id, req.user.id, req.tenantId);
  
  res.json({
    success: true,
    data: progress,
    message: 'Lesson marked as completed'
  });
}));

export default router;

