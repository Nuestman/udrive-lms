// Certificate Routes - Complete CRUD with role-based access
import express from 'express';
import certificateService from '../services/certificate.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/verify/:verificationCode', asyncHandler(async (req, res) => {
  // Decode the verification code from URL parameter
  const verificationCode = decodeURIComponent(req.params.verificationCode);
  console.log('Certificate verification request for code:', verificationCode);
  
  const certificate = await certificateService.verifyCertificateByCode(verificationCode);
  
  res.json({
    success: true,
    data: certificate
  });
}));

// Protected routes
router.use(requireAuth);
router.use(tenantContext);

/**
 * POST /api/certificates/generate
 * Generate certificate for completed enrollment
 * Access: Students (own enrollments), Instructors, Admins, Super Admin
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const { enrollment_id } = req.body;
  
  if (!enrollment_id) {
    return res.status(400).json({
      success: false,
      error: 'Enrollment ID is required'
    });
  }

  // Check if user can generate certificate for this enrollment
  if (req.user.role === 'student') {
    // Students can only generate certificates for their own enrollments
    // We'll let the service handle this check since it validates enrollment ownership
  }

  const certificate = await certificateService.generateCertificate(
    enrollment_id,
    req.tenantId,
    req.isSuperAdmin,
    req.user.role === 'student' ? req.user.id : null,
    req.app.get('io')
  );
  
  res.status(201).json({
    success: true,
    data: certificate,
    message: 'Certificate generated successfully'
  });
}));

/**
 * GET /api/certificates
 * Get all certificates with filters (admin/instructor view)
 * Access: Instructors, Admins, Super Admin
 */
router.get('/', asyncHandler(async (req, res) => {
  // Check role authorization
  if (!['instructor', 'school_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Insufficient permissions'
    });
  }
  const filters = {
    student_id: req.query.student_id,
    course_id: req.query.course_id,
    status: req.query.status,
    search: req.query.search,
    limit: req.query.limit ? parseInt(req.query.limit) : 50,
    offset: req.query.offset ? parseInt(req.query.offset) : 0
  };

  const certificates = await certificateService.getAllCertificates(
    req.tenantId,
    filters,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: certificates
  });
}));

/**
 * GET /api/certificates/stats
 * Get certificate statistics for dashboard
 * Access: Instructors, Admins, Super Admin
 */
router.get('/stats', asyncHandler(async (req, res) => {
  // Check role authorization
  if (!['instructor', 'school_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Insufficient permissions'
    });
  }
  const stats = await certificateService.getCertificateStats(
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/certificates/:id
 * Get certificate details
 * Access: Students (own certificates), Instructors, Admins, Super Admin
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const certificate = await certificateService.getCertificateById(
    req.params.id,
    req.tenantId,
    req.isSuperAdmin
  );

  // Students can only view their own certificates (unless they're admins in student mode)
  // Check activeRole for student restriction, but allow access via primaryRole for admin checks
  const hasAdminAccess = ['super_admin', 'school_admin', 'instructor'].includes(req.user.primaryRole || req.user.role);
  if (req.user.activeRole === 'student' && certificate.student_id !== req.user.id && !hasAdminAccess) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Can only view your own certificates'
    });
  }
  
  res.json({
    success: true,
    data: certificate
  });
}));

/**
 * GET /api/certificates/student/:studentId
 * Get all certificates for a student
 * Access: Students (own certificates), Instructors, Admins, Super Admin
 */
router.get('/student/:studentId', asyncHandler(async (req, res) => {
  // Students can only view their own certificates (unless they're admins in student mode)
  // Check activeRole for student restriction, but allow access via primaryRole for admin checks
  const hasAdminAccess = ['super_admin', 'school_admin', 'instructor'].includes(req.user.primaryRole || req.user.role);
  if (req.user.activeRole === 'student' && req.params.studentId !== req.user.id && !hasAdminAccess) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Can only view your own certificates'
    });
  }

  const certificates = await certificateService.getStudentCertificates(
    req.params.studentId,
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: certificates
  });
}));

/**
 * GET /api/certificates/enrollment/:enrollmentId
 * Get certificates for specific enrollment
 * Access: Students (own enrollments), Instructors, Admins, Super Admin
 */
router.get('/enrollment/:enrollmentId', asyncHandler(async (req, res) => {
  const certificates = await certificateService.getCertificatesForEnrollment(
    req.params.enrollmentId,
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: certificates
  });
}));

/**
 * PUT /api/certificates/:id/status
 * Update certificate status (approve/revoke)
 * Access: Instructors, Admins, Super Admin
 */
router.put('/:id/status', asyncHandler(async (req, res) => {
  // Check role authorization
  if (!['instructor', 'school_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Insufficient permissions'
    });
  }
  const { status, notes } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status is required'
    });
  }

  const certificate = await certificateService.updateCertificateStatus(
    req.params.id,
    status,
    req.user.id,
    req.tenantId,
    req.isSuperAdmin,
    notes
  );
  
  res.json({
    success: true,
    data: certificate,
    message: `Certificate ${status} successfully`
  });
}));

/**
 * DELETE /api/certificates/:id
 * Delete certificate (soft delete by revoking)
 * Access: Instructors, Admins, Super Admin
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  // Check role authorization
  if (!['instructor', 'school_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Insufficient permissions'
    });
  }
  const { reason } = req.body;
  
  const certificate = await certificateService.deleteCertificate(
    req.params.id,
    req.user.id,
    req.tenantId,
    req.isSuperAdmin,
    reason || 'Certificate deleted by administrator'
  );
  
  res.json({
    success: true,
    data: certificate,
    message: 'Certificate deleted successfully'
  });
}));

export default router;

