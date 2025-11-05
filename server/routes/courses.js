// Courses Routes
import express from 'express';
import coursesService from '../services/courses.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole, permissions } from '../middleware/rbac.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createNotification } from '../services/notifications.service.js';

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
 * Get single course by slug
 * - Super Admin: Any course by slug
 * - Others: Only if course belongs to their tenant
 */
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const course = await coursesService.getCourseBySlug(req.params.slug, req.tenantId, req.isSuperAdmin);
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
  console.log('🎓 [COURSE-CREATE] Course creation request received:', { 
    userId: req.user.id, 
    userEmail: req.user.email,
    courseTitle: req.body.title 
  });
  
  const course = await coursesService.createCourse(req.body, req.user);
  console.log('🎓 [COURSE-CREATE] Course created successfully:', { 
    courseId: course.id, 
    courseTitle: course.title 
  });
  
  // Create notification for course creation
  const io = req.app.get('io');
  try {
    await createNotification(req.user.id, {
      type: 'success',
      title: 'Course Created',
      message: `Course "${course.title}" has been created successfully.`,
      link: `/courses/${course.id}`,
      data: { courseId: course.id, courseTitle: course.title }
    }, io);
    console.log('🎓 [COURSE-CREATE] Notification created successfully');
  } catch (notificationError) {
    console.error('🎓 [COURSE-CREATE] Failed to create notification:', notificationError);
  }
  
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
  const io = req.app.get('io');
  const course = await coursesService.updateCourse(req.params.id, req.body, req.user, io);
  
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
  
  // Create notification for course publishing
  const io = req.app.get('io');
  await createNotification(req.user.id, {
    type: 'success',
    title: 'Course Published',
    message: `Course "${course.title}" has been published and is now available to students.`,
    link: `/courses/${course.id}`,
    data: { courseId: course.id, courseTitle: course.title }
  }, io);
  
  res.json({
    success: true,
    data: course,
    message: 'Course published successfully'
  });
}));

export default router;

