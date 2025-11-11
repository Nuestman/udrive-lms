// Feedback Routes - platform feedback collection
import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createPlatformFeedback,
  getPlatformFeedbackSummary,
  listPlatformFeedback,
} from '../services/platformFeedback.service.js';

const router = express.Router();

/**
 * POST /api/feedback/platform
 * Submit structured platform feedback (authenticated users)
 */
router.post(
  '/platform',
  requireAuth,
  asyncHandler(async (req, res) => {
    const feedback = await createPlatformFeedback({
      userId: req.user.id,
      tenantId: req.user.tenant_id || null,
      onboarding_score: req.body.onboarding_score,
      usability_score: req.body.usability_score,
      ui_score: req.body.ui_score,
      navigation_score: req.body.navigation_score,
      support_score: req.body.support_score,
      role_context: req.body.role_context,
      comments: req.body.comments,
      submitted_from: req.body.submitted_from,
      additional_context: req.body.additional_context,
    });

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Thank you for sharing your feedback!',
    });
  })
);

/**
 * GET /api/feedback/platform
 * List platform feedback responses (admin only)
 */
router.get(
  '/platform',
  requireAuth,
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    const primaryRole = req.user.primaryRole || req.user.role;
    const data = await listPlatformFeedback({
      tenantId: req.query.tenant_id || req.user.tenant_id || null,
      isSuperAdmin: primaryRole === 'super_admin',
      limit: req.query.limit ? Math.min(parseInt(req.query.limit, 10) || 50, 200) : 50,
      offset: req.query.offset ? Math.max(parseInt(req.query.offset, 10) || 0, 0) : 0,
    });

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * GET /api/feedback/platform/summary
 * Aggregate metrics (admin only)
 */
router.get(
  '/platform/summary',
  requireAuth,
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    const primaryRole = req.user.primaryRole || req.user.role;
    const summary = await getPlatformFeedbackSummary({
      tenantId: req.query.tenant_id || req.user.tenant_id || null,
      isSuperAdmin: primaryRole === 'super_admin',
    });

    res.json({
      success: true,
      data: summary,
    });
  })
);

export default router;


