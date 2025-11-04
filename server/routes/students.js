// Students Routes
import express from 'express';
import studentsService from '../services/students.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { permissions } from '../middleware/rbac.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);
router.use(tenantContext);

/**
 * GET /api/students
 * Get all students
 * - Super Admin: All students from all schools
 * - Others: Only their school's students
 */
router.get('/', asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    search: req.query.search
  };

  const students = await studentsService.getStudents(req.tenantId, filters, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: students
  });
}));

/**
 * GET /api/students/:id
 * Get single student
 * - Super Admin: Any student
 * - Others: Only if in their school
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const student = await studentsService.getStudentById(req.params.id, req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: student
  });
}));

/**
 * GET /api/students/:id/progress
 * Get student progress
 */
router.get('/:id/progress', asyncHandler(async (req, res) => {
  const progress = await studentsService.getStudentProgress(req.params.id, req.tenantId);
  
  res.json({
    success: true,
    data: progress
  });
}));

/**
 * POST /api/students
 * Create new student (Admin only)
 */
router.post('/', asyncHandler(async (req, res) => {
  const student = await studentsService.createStudent(req.body, req.tenantId, req.app.get('io'));
  
  res.status(201).json({
    success: true,
    data: student,
    message: 'Student created successfully'
  });
}));

/**
 * PUT /api/students/:id
 * Update student (Admin only)
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const student = await studentsService.updateStudent(req.params.id, req.body, req.tenantId);
  
  res.json({
    success: true,
    data: student,
    message: 'Student updated successfully'
  });
}));

/**
 * DELETE /api/students/:id
 * Deactivate student (Admin only)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await studentsService.deleteStudent(req.params.id, req.tenantId);
  
  res.json({
    success: true,
    message: 'Student deactivated successfully'
  });
}));

/**
 * POST /api/students/:id/reset-password
 * Admin reset student password to default (school admin/super admin only)
 */
router.post('/:id/reset-password', asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const result = await studentsService.adminResetPassword(
    req.params.id, 
    req.tenantId, 
    req.isSuperAdmin,
    newPassword || 'welcome123'
  );
  
  res.json({
    success: true,
    data: result,
    message: 'Student password reset successfully'
  });
}));

export default router;

