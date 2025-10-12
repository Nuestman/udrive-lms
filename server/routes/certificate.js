// Certificate Routes
import express from 'express';
import certificateService from '../services/certificate.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(requireAuth);
router.use(tenantContext);

/**
 * POST /api/certificates/generate
 * Generate certificate for completed enrollment
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const { enrollment_id } = req.body;
  
  if (!enrollment_id) {
    return res.status(400).json({
      success: false,
      error: 'Enrollment ID is required'
    });
  }

  const certificate = await certificateService.generateCertificate(
    enrollment_id,
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.status(201).json({
    success: true,
    data: certificate,
    message: 'Certificate generated successfully'
  });
}));

/**
 * GET /api/certificates/:id
 * Get certificate details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const certificate = await certificateService.getCertificateById(
    req.params.id,
    req.tenantId,
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: certificate
  });
}));

/**
 * GET /api/certificates/student/:studentId
 * Get all certificates for a student
 */
router.get('/student/:studentId', asyncHandler(async (req, res) => {
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

export default router;

