// Testimonials Routes
import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  listTestimonials,
  listPublishedTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../services/testimonials.service.js';

const router = express.Router();

/**
 * GET /api/testimonials/public
 * Fetch published testimonials for marketing surfaces
 */
router.get(
  '/public',
  asyncHandler(async (req, res) => {
    const testimonials = await listPublishedTestimonials({
      placement: req.query.placement || null,
      limit: req.query.limit ? Math.min(parseInt(req.query.limit, 10) || 12, 100) : 12,
      featuredOnly: req.query.featured === 'true',
    });

    res.json({
      success: true,
      data: testimonials,
    });
  })
);

/**
 * GET /api/testimonials
 * List testimonials (admin only)
 */
router.get(
  '/',
  requireAuth,
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    const testimonials = await listTestimonials({
      status: req.query.status,
      placement: req.query.placement,
    });

    res.json({
      success: true,
      data: testimonials,
    });
  })
);

/**
 * POST /api/testimonials
 * Create testimonial (admin only)
 */
router.post(
  '/',
  requireAuth,
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    const testimonial = await createTestimonial(req.body || {});

    res.status(201).json({
      success: true,
      data: testimonial,
      message: 'Testimonial created',
    });
  })
);

/**
 * PUT /api/testimonials/:id
 * Update testimonial (admin only)
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    const testimonial = await updateTestimonial(req.params.id, req.body || {});

    res.json({
      success: true,
      data: testimonial,
      message: 'Testimonial updated',
    });
  })
);

/**
 * DELETE /api/testimonials/:id
 * Delete testimonial (admin only)
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    await deleteTestimonial(req.params.id);

    res.json({
      success: true,
      message: 'Testimonial deleted',
    });
  })
);

export default router;


