// Course Review Settings Routes
import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { permissions } from '../middleware/rbac.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { query } from '../lib/db.js';
import {
  getCourseReviewSettings,
  upsertCourseReviewSettings,
} from '../services/courseReviewSettings.service.js';

const router = express.Router();

router.use(requireAuth);
router.use(tenantContext);

/**
 * GET /api/review-settings/:courseId
 * Fetch review prompt settings for a course
 * - Super admin: any course
 * - School admin / instructor: courses within their tenant
 * - Students: only courses they are enrolled in
 */
router.get(
  '/:courseId',
  asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { role, activeRole, id: userId } = req.user;
    const { tenantId, isSuperAdmin } = req;

    const effectiveRole = activeRole || role;
    const elevatedRoles = ['super_admin', 'school_admin', 'instructor'];

    if (!isSuperAdmin) {
      if (effectiveRole === 'student') {
        const enrollmentCheck = await query(
          `SELECT 1
             FROM enrollments e
             JOIN courses c ON c.id = e.course_id
            WHERE e.course_id = $1
              AND e.student_id = $2
              AND c.tenant_id = $3`,
          [courseId, userId, tenantId]
        );

        if (enrollmentCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'You must be enrolled in this course to view review prompts.',
          });
        }
      } else if (elevatedRoles.includes(effectiveRole)) {
        const courseTenant = await query(
          `SELECT tenant_id FROM courses WHERE id = $1`,
          [courseId]
        );

        if (courseTenant.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Course not found',
          });
        }

        if (courseTenant.rows[0].tenant_id !== tenantId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied - course belongs to a different school',
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to view review settings',
        });
      }
    }

    const settings = await getCourseReviewSettings(courseId);

    res.json({
      success: true,
      data: settings,
    });
  })
);

/**
 * PUT /api/review-settings/:courseId
 * Upsert review prompt settings for a course
 */
router.put(
  '/:courseId',
  permissions.canEditCourse,
  asyncHandler(async (req, res) => {
    const settings = await upsertCourseReviewSettings(req.params.courseId, req.body || {});

    res.json({
      success: true,
      data: settings,
      message: 'Review settings updated',
    });
  })
);

export default router;


