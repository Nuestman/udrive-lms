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

export default router;

