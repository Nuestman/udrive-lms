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

  // Security: when in student mode, force scope to current user unless explicitly querying own id
  if (req.user.activeRole === 'student') {
    filters.student_id = req.user.id;
  }

  const enrollments = await enrollmentsService.getEnrollments(req.tenantId, filters, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: enrollments
  });
}));

/**
 * GET /api/enrollments/:id
 * Get single enrollment by ID
 * - Super Admin: Any enrollment from any tenant
 * - Others: Only if enrollment's course belongs to their tenant
 */
router.get('/:id', asyncHandler(async (req, res) => {
  let result;
  
  if (req.isSuperAdmin && req.tenantId === null) {
    // Super admin: Access any enrollment
    result = await query(
      `SELECT e.*, c.title as course_title
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.id = $1`,
      [req.params.id]
    );
  } else {
    // Tenant-scoped: Only enrollments from their tenant
    result = await query(
    `SELECT e.*, c.title as course_title
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
      WHERE e.id = $1 AND c.tenant_id = $2`,
    [req.params.id, req.tenantId]
  );
  }

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Enrollment not found' });
  }

  const enrollment = result.rows[0];

  // Users can only view their own enrollment unless they have admin privileges
  // Check activeRole for permission, but allow access to primary role for admin checks
  const hasAdminAccess = ['super_admin', 'school_admin', 'instructor'].includes(req.user.primaryRole || req.user.role);
  if (req.user.id !== enrollment.student_id && !hasAdminAccess) {
    return res.status(403).json({ success: false, error: 'You can only view your own enrollments' });
  }

  res.json({ success: true, data: enrollment });
}));

/**
 * GET /api/enrollments/student/:studentId
 * Get enrollments for a student
 */
router.get('/student/:studentId', asyncHandler(async (req, res) => {
  // Users can view their own enrollments, admins can view any enrollments
  // Check primaryRole for admin access (allows admins to view even when in student mode)
  const hasAdminAccess = ['super_admin', 'school_admin', 'instructor'].includes(req.user.primaryRole || req.user.role);
  if (req.user.id !== req.params.studentId && !hasAdminAccess) {
    return res.status(403).json({ 
      success: false, 
      error: 'You can only view your own enrollments' 
    });
  }

  const enrollments = await enrollmentsService.getStudentEnrollments(req.params.studentId, req.tenantId, req.isSuperAdmin);
  
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
  const payload = { ...req.body };

  // Student self-enrollment: allowed when activeRole is 'student' (includes role-switched users)
  if (!payload.student_id) {
    if (req.user.activeRole !== 'student') {
      return res.status(403).json({ success: false, error: 'Only students can enroll themselves. Provide a student_id to enroll others.' });
    }
    payload.student_id = req.user.id;
  }

  // Prevent non-students from enrolling themselves via explicit student_id
  // Allow if activeRole is 'student' (even if primary role is elevated)
  if (payload.student_id === req.user.id && req.user.activeRole !== 'student') {
    return res.status(403).json({ success: false, error: 'Only student users can be enrolled in courses.' });
  }

  // Pass activeRole context to service for validation
  const enrollment = await enrollmentsService.enrollStudent(
    payload, 
    req.tenantId, 
    req.user.activeRole === 'student' ? req.user.id : null, // Pass authenticated user id if in student mode
    req.isSuperAdmin // Pass super admin flag to allow cross-tenant enrollment
  );
  
  res.status(201).json({
    success: true,
    data: enrollment,
    message: 'User enrolled successfully'
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

  // Allow access if user is the student OR has admin privileges (check primaryRole)
  const hasAdminAccess = ['super_admin', 'school_admin', 'instructor'].includes(req.user.primaryRole || req.user.role);
  if (req.user.id !== enrollment.rows[0].student_id && !hasAdminAccess) {
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
 * - Students can only unenroll themselves
 * - Admins/Instructors can unenroll any student
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  // Check if enrollment exists and get student_id
  const enrollmentCheck = await query(
    'SELECT student_id FROM enrollments WHERE id = $1',
    [req.params.id]
  );

  if (enrollmentCheck.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Enrollment not found' });
  }

  const enrollment = enrollmentCheck.rows[0];

  // Students can only unenroll themselves; admins/instructors can unenroll anyone
  // Check activeRole for student mode, but allow admin access based on primaryRole
  const isStudentMode = req.user.activeRole === 'student';
  const hasAdminAccess = ['super_admin', 'school_admin', 'instructor'].includes(req.user.primaryRole || req.user.role);
  if (isStudentMode && !hasAdminAccess && enrollment.student_id !== req.user.id) {
    return res.status(403).json({ 
      success: false, 
      error: 'You can only unenroll yourself from courses' 
    });
  }

  await enrollmentsService.unenrollStudent(req.params.id, req.tenantId);
  
  res.json({
    success: true,
    message: 'Student unenrolled successfully'
  });
}));

export default router;

