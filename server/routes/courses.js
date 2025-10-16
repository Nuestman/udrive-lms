// Courses Routes
import express from 'express';
import coursesService from '../services/courses.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole, permissions } from '../middleware/rbac.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication and tenant context
router.use(requireAuth);
router.use(tenantContext);

/**
 * GET /api/courses
 * Get all courses
 * - Super Admin: All courses from all schools
 * - Others: Only their school's courses
 */
router.get('/', asyncHandler(async (req, res) => {
  const courses = await coursesService.getCourses(req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: courses
  });
}));

/**
 * GET /api/courses/slug/:slug
 * Get single course by slug (tenant scoped)
 */
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const course = await coursesService.getCourseBySlug(req.params.slug, req.tenantId);
  res.json({ success: true, data: course });
}));

/**
 * GET /api/courses/:id
 * Get single course by ID
 * - Super Admin: Any course
 * - Others: Only if in their school
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const course = await coursesService.getCourseById(req.params.id, req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: course
  });
}));

/**
 * GET /api/courses/:id/full
 * Get course with all modules and lessons
 */
router.get('/:id/full', asyncHandler(async (req, res) => {
  const course = await coursesService.getCourseWithContent(req.params.id, req.tenantId);
  
  res.json({
    success: true,
    data: course
  });
}));

/**
 * GET /api/courses/:id/stats
 * Get course statistics
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const stats = await coursesService.getCourseStats(req.params.id, req.tenantId);
  
  res.json({
    success: true,
    data: stats
  });
}));

/**
 * POST /api/courses
 * Create new course
 */
router.post('/', asyncHandler(async (req, res) => {
  const course = await coursesService.createCourse(req.body, req.user);
  
  res.status(201).json({
    success: true,
    data: course,
    message: 'Course created successfully'
  });
}));

/**
 * PUT /api/courses/:id
 * Update course
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const course = await coursesService.updateCourse(req.params.id, req.body, req.user);
  
  res.json({
    success: true,
    data: course,
    message: 'Course updated successfully'
  });
}));

/**
 * DELETE /api/courses/:id
 * Delete course
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await coursesService.deleteCourse(req.params.id, req.tenantId);
  
  res.json({
    success: true,
    message: 'Course deleted successfully'
  });
}));

/**
 * POST /api/courses/:id/publish
 * Publish course
 */
router.post('/:id/publish', asyncHandler(async (req, res) => {
  const course = await coursesService.publishCourse(req.params.id, req.user);
  
  res.json({
    success: true,
    data: course,
    message: 'Course published successfully'
  });
}));

export default router;

