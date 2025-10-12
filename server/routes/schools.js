// Schools/Tenants Routes - Super Admin Only
import express from 'express';
import schoolsService from '../services/schools.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Middleware to ensure only super admin can access
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Super admin only'
    });
  }
  next();
};

router.use(requireSuperAdmin);

/**
 * GET /api/schools
 * Get all schools (super admin only)
 */
router.get('/', asyncHandler(async (req, res) => {
  const schools = await schoolsService.getAllSchools();
  
  res.json({
    success: true,
    data: schools
  });
}));

/**
 * GET /api/schools/:id
 * Get single school
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const school = await schoolsService.getSchoolById(req.params.id);
  
  res.json({
    success: true,
    data: school
  });
}));

/**
 * GET /api/schools/:id/stats
 * Get school statistics
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const stats = await schoolsService.getSchoolStats(req.params.id);
  
  res.json({
    success: true,
    data: stats
  });
}));

/**
 * POST /api/schools
 * Create new school
 */
router.post('/', asyncHandler(async (req, res) => {
  const school = await schoolsService.createSchool(req.body);
  
  res.status(201).json({
    success: true,
    data: school,
    message: 'School created successfully'
  });
}));

/**
 * PUT /api/schools/:id
 * Update school
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const school = await schoolsService.updateSchool(req.params.id, req.body);
  
  res.json({
    success: true,
    data: school,
    message: 'School updated successfully'
  });
}));

/**
 * DELETE /api/schools/:id
 * Delete/deactivate school
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await schoolsService.deleteSchool(req.params.id);
  
  res.json({
    success: true,
    message: 'School deactivated successfully'
  });
}));

export default router;

