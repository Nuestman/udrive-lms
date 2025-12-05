// SCORM Routes
// Handles SCORM package uploads, SCO listing, and runtime commit

import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.middleware.js';
import { getClient } from '../lib/db.js';
import {
  createScormPackageFromUpload,
  getScosByPackageId,
  commitScormRuntime,
  getScormLaunchConfigForLesson,
  listScormPackagesForTenant,
  getUserScormAttemptsForLesson,
  getScormSummaryForLesson,
  createCourseFromScormPackage,
  getScormPackageByCourseId,
  deleteScormPackage,
  verifyScormFileExists,
} from '../services/scorm.service.js';

const router = express.Router();

// Rate limiter for SCORM API routes
const scormApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many SCORM API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// All SCORM routes require auth and tenant context
router.use(scormApiLimiter); // Apply rate limiting to all SCORM routes
router.use(requireAuth);
router.use(tenantContext);

/**
 * POST /api/scorm/upload
 * Upload a SCORM 1.2 package (.zip), parse manifest, store metadata and SCOs.
 */
router.post(
  '/upload',
  uploadSingle('file', {
    // Allow any file type (SCORM is usually application/zip or application/octet-stream)
    allowedTypes: [],
    maxSize: 200, // MB
  }),
  handleUploadError,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No SCORM package file provided',
      });
    }

    const { courseId } = req.body;

    const result = await createScormPackageFromUpload({
      tenantId: req.tenantId,
      courseId: courseId || null,
      ownerId: req.user.id,
      fileBuffer: req.file.buffer,
      originalFilename: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    res.status(201).json({
      success: true,
      message: 'SCORM package uploaded and processed successfully',
      data: {
        package: result.package,
        scos: result.scos,
        upload: {
          url: result.upload.url,
          pathname: result.upload.pathname,
        },
      },
    });
  })
);

/**
 * GET /api/scorm/packages/:packageId/sco-list
 * List SCOs for a given SCORM package (for admin/course editor UI).
 */
router.get(
  '/packages/:packageId/sco-list',
  asyncHandler(async (req, res) => {
    const { packageId } = req.params;
    const isSuperAdmin = req.user.role === 'super_admin';

    const data = await getScosByPackageId(packageId, req.tenantId, isSuperAdmin);

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * POST /api/scorm/runtime/commit
 * Commit SCORM runtime data for the current user × SCO × attempt.
 */
router.post(
  '/runtime/commit',
  asyncHandler(async (req, res) => {
    const { scoId, attemptNo, cmi } = req.body || {};

    if (!scoId) {
      return res.status(400).json({
        success: false,
        message: 'scoId is required',
      });
    }

    const attempt = await commitScormRuntime({
      userId: req.user.id,
      tenantId: req.tenantId,
      scoId,
      attemptNo: attemptNo || 1,
      cmi: cmi || {},
    });

    res.json({
      success: true,
      data: attempt,
      message: 'SCORM runtime data committed successfully',
    });
  })
);

/**
 * GET /api/scorm/launch/:lessonId
 * Resolve launch configuration for a SCORM lesson (used by front-end player).
 */
router.get(
  '/launch/:lessonId',
  asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const isSuperAdmin = req.user.role === 'super_admin';

    const config = await getScormLaunchConfigForLesson(
      lessonId,
      req.tenantId,
      isSuperAdmin
    );

    res.json({
      success: true,
      data: config,
    });
  })
);

/**
 * GET /api/scorm/packages
 * List SCORM packages for the current tenant.
 */
router.get(
  '/packages',
  asyncHandler(async (req, res) => {
    const isSuperAdmin = req.user.role === 'super_admin';
    const packages = await listScormPackagesForTenant(req.tenantId, isSuperAdmin);

    res.json({
      success: true,
      data: packages,
    });
  })
);

/**
 * GET /api/scorm/attempts/:lessonId
 * Get SCORM attempts for the current user and a given lesson.
 */
router.get(
  '/attempts/:lessonId',
  asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const isSuperAdmin = req.user.role === 'super_admin';

    const attempts = await getUserScormAttemptsForLesson(
      req.user.id,
      lessonId,
      req.tenantId,
      isSuperAdmin
    );

    res.json({
      success: true,
      data: attempts,
    });
  })
);

/**
 * GET /api/scorm/summary/:lessonId
 * Get aggregated SCORM summary for a lesson (admin / instructor analytics).
 */
router.get(
  '/summary/:lessonId',
  asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const isSuperAdmin = req.user.role === 'super_admin';

    const summary = await getScormSummaryForLesson(
      lessonId,
      req.tenantId,
      isSuperAdmin
    );

    res.json({
      success: true,
      data: summary,
    });
  })
);

/**
 * POST /api/scorm/packages/:packageId/create-course
 * Create a SunLMS course from an uploaded SCORM package.
 * Admin-only endpoint.
 */
router.post(
  '/packages/:packageId/create-course',
  asyncHandler(async (req, res) => {
    const { packageId } = req.params;
    const { title, description, status, duration_weeks, price } = req.body;

    // Only admins/instructors can create courses
    if (!['super_admin', 'school_admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and instructors can create courses from SCORM packages',
      });
    }

    const result = await createCourseFromScormPackage({
      packageId,
      tenantId: req.tenantId,
      userId: req.user.id,
      courseData: {
        title,
        description,
        status,
        duration_weeks,
        price,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course created from SCORM package successfully',
      data: result,
    });
  })
);

/**
 * GET /api/scorm/course/:courseId/package
 * Get SCORM package info for a course
 */
router.get(
  '/course/:courseId/package',
  asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const isSuperAdmin = req.user.role === 'super_admin';

    const packageInfo = await getScormPackageByCourseId(
      courseId,
      req.tenantId,
      isSuperAdmin
    );

    if (!packageInfo) {
      return res.json({
        success: true,
        data: null,
        message: 'No SCORM package linked to this course',
      });
    }

    // Get SCOs for this package
    const scos = await getScosByPackageId(packageInfo.id, req.tenantId, isSuperAdmin);

    res.json({
      success: true,
      data: {
        package: packageInfo,
        scos: scos.scos || [],
      },
    });
  })
);

/**
 * DELETE /api/scorm/packages/:packageId
 * Delete a SCORM package and all associated data
 */
router.delete(
  '/packages/:packageId',
  asyncHandler(async (req, res) => {
    const { packageId } = req.params;
    const isSuperAdmin = req.user.role === 'super_admin';

    // Only admins/instructors can delete packages
    if (!['super_admin', 'school_admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and instructors can delete SCORM packages',
      });
    }

    await deleteScormPackage(packageId, req.tenantId, isSuperAdmin);

    res.json({
      success: true,
      message: 'SCORM package deleted successfully',
    });
  })
);

/**
 * GET /api/scorm/verify-file/:packageId
 * Verify that a SCORM file exists at the given path (checks Vercel Blob or local filesystem)
 */
router.get(
  '/verify-file/:packageId',
  asyncHandler(async (req, res) => {
    const { packageId } = req.params;
    const { filePath } = req.query;
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'filePath query parameter is required',
      });
    }

    try {
      const result = await verifyScormFileExists(
        packageId,
        filePath,
        req.tenantId,
        isSuperAdmin
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error('[SCORM] Verify file error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to check file',
      });
    }
  })
);

// Note: SCORM content serving is handled by app.use('/api/scorm/content', ...) in server/index.js
// This uses path-style URLs: /api/scorm/content/<packageId>/<filePath>
// The old query-parameter route has been removed in favor of the cleaner path-style approach.

export default router;


