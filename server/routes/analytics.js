// Analytics Routes
import express from 'express';
import analyticsService from '../services/analytics.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(requireAuth);
router.use(tenantContext);

/**
 * GET /api/analytics/dashboard
 * Get dashboard statistics
 * - Super Admin: System-wide stats
 * - Others: Their school's stats only
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const stats = await analyticsService.getDashboardStats(req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/analytics/activity
 * Get recent activity
 */
router.get('/activity', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const activities = await analyticsService.getRecentActivity(req.tenantId, limit);
  
  res.json({
    success: true,
    data: activities
  });
}));

/**
 * GET /api/analytics/enrollment-trends
 * Get enrollment trends aggregated by interval
 */
router.get('/enrollment-trends', asyncHandler(async (req, res) => {
  const interval = (req.query.interval || 'week').toString();
  const periods = parseInt(req.query.periods) || 12;
  const trends = await analyticsService.getEnrollmentTrends(req.tenantId, { interval, periods });

  res.json({
    success: true,
    data: trends
  });
}));

/**
 * GET /api/analytics/course-performance
 * Get course performance summary
 */
router.get('/course-performance', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const data = await analyticsService.getCoursePerformance(req.tenantId, limit);

  res.json({
    success: true,
    data
  });
}));

/**
 * GET /api/analytics/school-performance
 * Get school performance metrics (super admin only)
 */
router.get('/school-performance', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Super admin only'
    });
  }

  const limit = parseInt(req.query.limit) || 10;
  const data = await analyticsService.getSchoolPerformance(limit);

  res.json({
    success: true,
    data
  });
}));

/**
 * GET /api/analytics/school-stats
 * Get school statistics (super admin only)
 */
router.get('/school-stats', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Super admin only'
    });
  }

  const data = await analyticsService.getSchoolStats();

  res.json({
    success: true,
    data
  });
}));

export default router;

