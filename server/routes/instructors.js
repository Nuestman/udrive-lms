// Instructor Management Routes
import express from 'express';
import instructorsService from '../services/instructors.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/instructors
 * Get all instructors with filtering and pagination
 */
router.get('/', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { status, search, page, limit, sortBy, sortOrder } = req.query;
    
    // If school admin, only show instructors from their tenant
    const tenantId = req.user.role === 'school_admin' ? req.user.tenant_id : null;

    const result = await instructorsService.getAllInstructors({
      tenantId,
      status,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: result.instructors,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all instructors error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instructors/statistics
 * Get instructor statistics
 */
router.get('/statistics', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const tenantId = req.user.role === 'school_admin' ? req.user.tenant_id : null;
    const stats = await instructorsService.getInstructorStatistics(tenantId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get instructor statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instructors/activity
 * Get instructor activity over time
 */
router.get('/activity', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const tenantId = req.user.role === 'school_admin' ? req.user.tenant_id : null;
    
    const activity = await instructorsService.getInstructorActivity(tenantId, parseInt(days));

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Get instructor activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instructors/top
 * Get top instructors by performance
 */
router.get('/top', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const tenantId = req.user.role === 'school_admin' ? req.user.tenant_id : null;
    
    const topInstructors = await instructorsService.getTopInstructors(tenantId, parseInt(limit));

    res.json({
      success: true,
      data: topInstructors
    });
  } catch (error) {
    console.error('Get top instructors error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instructors/:id
 * Get instructor by ID
 */
router.get('/:id', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const instructor = await instructorsService.getInstructorById(id);

    // School admins can only view instructors from their tenant
    if (req.user.role === 'school_admin' && instructor.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: instructor
    });
  } catch (error) {
    console.error('Get instructor by ID error:', error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/instructors/:id/courses
 * Get courses created by instructor
 */
router.get('/:id/courses', requireRole(['super_admin', 'school_admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Instructors can only view their own courses
    if (req.user.role === 'instructor' && id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get instructor to check tenant
    const instructor = await instructorsService.getInstructorById(id);

    // School admins can only view instructors from their tenant
    if (req.user.role === 'school_admin' && instructor.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const courses = await instructorsService.getInstructorCourses(id);

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Get instructor courses error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/instructors
 * Create new instructor
 */
router.post('/', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const instructorData = req.body;

    // School admins can only create instructors in their tenant
    if (req.user.role === 'school_admin') {
      instructorData.tenant_id = req.user.tenant_id;
    }

    const instructor = await instructorsService.createInstructor(instructorData);

    res.status(201).json({
      success: true,
      data: instructor,
      message: 'Instructor created successfully'
    });
  } catch (error) {
    console.error('Create instructor error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/instructors/:id
 * Update instructor
 */
router.put('/:id', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get instructor to check permissions
    const existingInstructor = await instructorsService.getInstructorById(id);

    // School admins can only update instructors in their tenant
    if (req.user.role === 'school_admin' && existingInstructor.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const instructor = await instructorsService.updateInstructor(id, updates);

    res.json({
      success: true,
      data: instructor,
      message: 'Instructor updated successfully'
    });
  } catch (error) {
    console.error('Update instructor error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/instructors/:id/assign-course
 * Assign course to instructor
 */
router.post('/:id/assign-course', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Get instructor to check permissions
    const instructor = await instructorsService.getInstructorById(id);

    // School admins can only assign courses to instructors in their tenant
    if (req.user.role === 'school_admin' && instructor.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const course = await instructorsService.assignCourseToInstructor(id, courseId);

    res.json({
      success: true,
      data: course,
      message: 'Course assigned successfully'
    });
  } catch (error) {
    console.error('Assign course error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;

