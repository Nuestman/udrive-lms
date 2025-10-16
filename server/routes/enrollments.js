// Enrollments Routes
import express from 'express';
import enrollmentsService from '../services/enrollments.service.js';
import { query } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { permissions } from '../middleware/rbac.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(requireAuth);
router.use(tenantContext);

/**
 * GET /api/enrollments
 * Get all enrollments with filters
 * - Super Admin: All enrollments from all schools
 * - Others: Only their school's enrollments
 */
router.get('/', asyncHandler(async (req, res) => {
  const filters = {
    student_id: req.query.student_id,
    course_id: req.query.course_id,
    status: req.query.status
  };

  const enrollments = await enrollmentsService.getEnrollments(req.tenantId, filters, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: enrollments
  });
}));

/**
 * GET /api/enrollments/:id
 * Get single enrollment by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT e.*, c.title as course_title
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
      WHERE e.id = $1 AND c.tenant_id = $2`,
    [req.params.id, req.tenantId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Enrollment not found' });
  }

  const enrollment = result.rows[0];

  // Students can only view their own enrollment
  if (req.user.role === 'student' && req.user.id !== enrollment.student_id) {
    return res.status(403).json({ success: false, error: 'You can only view your own enrollments' });
  }

  res.json({ success: true, data: enrollment });
}));

/**
 * GET /api/enrollments/student/:studentId
 * Get enrollments for a student
 */
router.get('/student/:studentId', asyncHandler(async (req, res) => {
  // Students can view their own enrollments
  if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
    return res.status(403).json({ 
      success: false, 
      error: 'You can only view your own enrollments' 
    });
  }

  const enrollments = await enrollmentsService.getStudentEnrollments(req.params.studentId, req.tenantId);
  
  res.json({
    success: true,
    data: enrollments
  });
}));

/**
 * POST /api/enrollments
 * Enroll student in course
 */
router.post('/', asyncHandler(async (req, res) => {
  // If the actor is a student, force student_id to authenticated user id
  const payload = { ...req.body };
  if (req.user.role === 'student') {
    payload.student_id = req.user.id;
  }

  const enrollment = await enrollmentsService.enrollStudent(payload, req.tenantId);
  
  res.status(201).json({
    success: true,
    data: enrollment,
    message: 'Student enrolled successfully'
  });
}));

/**
 * PUT /api/enrollments/:id/status
 * Update enrollment status
 */
router.put('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const enrollment = await enrollmentsService.updateEnrollmentStatus(req.params.id, status, req.tenantId);
  
  res.json({
    success: true,
    data: enrollment,
    message: 'Enrollment status updated'
  });
}));

/**
 * PUT /api/enrollments/:id/progress
 * Update enrollment progress
 */
router.put('/:id/progress', asyncHandler(async (req, res) => {
  const { progress_percentage } = req.body;
  
  // Students can update their own progress, admins can update anyone's
  const enrollment = await query(
    'SELECT student_id FROM enrollments WHERE id = $1',
    [req.params.id]
  );

  if (enrollment.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Enrollment not found' });
  }

  if (req.user.role === 'student' && req.user.id !== enrollment.rows[0].student_id) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const updated = await enrollmentsService.updateEnrollmentProgress(
    req.params.id, 
    progress_percentage, 
    req.tenantId
  );
  
  res.json({
    success: true,
    data: updated
  });
}));

/**
 * DELETE /api/enrollments/:id
 * Unenroll student
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await enrollmentsService.unenrollStudent(req.params.id, req.tenantId);
  
  res.json({
    success: true,
    message: 'Student unenrolled successfully'
  });
}));

export default router;

