// Reviews Routes - handles creation and moderation of user reviews
import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createReview,
  getReviews,
  getUserReviews,
  updateReviewStatus,
  updateReviewVisibility,
  getPublicReviews,
  createReviewComment,
} from '../services/reviews.service.js';

const router = express.Router();

/**
 * POST /api/reviews
 * Create a new review (authenticated users)
 */
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { type, targetId, rating, title, body } = req.body;
    const io = req.app.get('io');

    const review = await createReview({
      userId: req.user.id,
      reviewableType: type,
      reviewableId: targetId,
      rating,
      title,
      body,
    }, { io });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully and is pending moderation',
    });
  })
);

/**
 * GET /api/reviews/mine
 * List reviews submitted by the authenticated user
 */
router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const reviews = await getUserReviews(req.user.id);

    res.json({
      success: true,
      data: reviews,
    });
  })
);

/**
 * GET /api/reviews/public
 * Fetch approved reviews for public consumption (e.g., landing page)
 */
router.get(
  '/public',
  asyncHandler(async (req, res) => {
    const { type = 'course', limit, reviewable_id } = req.query;
    const reviews = await getPublicReviews({
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
      reviewableId: reviewable_id || null,
    });

    res.json({
      success: true,
      data: reviews,
    });
  })
);

/**
 * POST /api/reviews/:id/comments
 * Allow authorized staff to respond to reviews
 */
router.post(
  '/:id/comments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { body } = req.body;

    const comment = await createReviewComment(req.params.id, body, req.user);

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    });
  })
);

/**
 * GET /api/reviews
 * Moderation list (admins only)
 */
router.get(
  '/',
  requireAuth,
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      reviewable_type: req.query.type,
      user_id: req.query.user_id,
      reviewable_id: req.query.reviewable_id,
      search: req.query.search,
      visibility: req.query.visibility,
      limit: req.query.limit,
      offset: req.query.offset,
    };

    const primaryRole = req.user.primaryRole || req.user.role;
    const reviews = await getReviews(filters, {
      tenantId: req.user.tenant_id || null,
      isSuperAdmin: primaryRole === 'super_admin',
    });

    res.json({
      success: true,
      data: reviews,
    });
  })
);

/**
 * PUT /api/reviews/:id/status
 * Update review status (approve/reject) - admins only
 */
router.put(
  '/:id/status',
  requireAuth,
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const primaryRole = req.user.primaryRole || req.user.role;
    const review = await updateReviewStatus(
      req.params.id,
      status,
      req.user.id,
      {
        tenantId: req.user.tenant_id || null,
        isSuperAdmin: primaryRole === 'super_admin',
      }
    );

    res.json({
      success: true,
      data: review,
      message: `Review ${status}`,
    });
  })
);

/**
 * PUT /api/reviews/:id/visibility
 * Update review visibility (internal/public) - admins only
 */
router.put(
  '/:id/visibility',
  requireAuth,
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    const { visibility } = req.body;
    const primaryRole = req.user.primaryRole || req.user.role;
    const review = await updateReviewVisibility(
      req.params.id,
      visibility,
      {
        tenantId: req.user.tenant_id || null,
        isSuperAdmin: primaryRole === 'super_admin',
      }
    );

    res.json({
      success: true,
      data: review,
      message: `Review visibility updated to ${visibility}`,
    });
  })
);

export default router;


