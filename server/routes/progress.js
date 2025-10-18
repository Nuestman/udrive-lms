// Progress Tracking Routes
import express from 'express';
import progressService from '../services/progress.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(requireAuth);
router.use(tenantContext);

/**
 * GET /api/progress/student/:studentId
 * Get student's overall progress across all courses
 */
router.get('/student/:studentId', asyncHandler(async (req, res) => {
  const progress = await progressService.getStudentProgress(
    req.params.studentId, 
    req.tenantId, 
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: progress
  });
}));

/**
 * GET /api/progress/course/:courseId/student/:studentId
 * Get student's progress for a specific course (detailed by module)
 */
router.get('/course/:courseId/student/:studentId', asyncHandler(async (req, res) => {
  const progress = await progressService.getCourseProgress(
    req.params.courseId,
    req.params.studentId,
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: progress
  });
}));

/**
 * GET /api/progress/course/:courseId/student/:studentId/unified
 * Get student's progress for a specific course with unified content (lessons + quizzes)
 */
router.get('/course/:courseId/student/:studentId/unified', asyncHandler(async (req, res) => {
  const progress = await progressService.getUnifiedCourseProgress(
    req.params.courseId,
    req.params.studentId,
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: progress
  });
}));

/**
 * POST /api/progress/lesson/:lessonId/complete
 * Mark lesson as completed for current user
 */
router.post('/lesson/:lessonId/complete', asyncHandler(async (req, res) => {
  const progress = await progressService.markLessonComplete(
    req.params.lessonId,
    req.user.id,  // Current user
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: progress,
    message: 'Lesson marked as completed'
  });
}));

/**
 * POST /api/progress/lesson/:lessonId/incomplete
 * Mark lesson as incomplete (undo completion)
 */
router.post('/lesson/:lessonId/incomplete', asyncHandler(async (req, res) => {
  const result = await progressService.markLessonIncomplete(
    req.params.lessonId,
    req.user.id,
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: result,
    message: 'Lesson marked as incomplete'
  });
}));

export default router;

