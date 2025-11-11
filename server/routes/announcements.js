import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
} from '../services/announcements.service.js';

const router = express.Router();

router.use(requireAuth);
router.use(tenantContext);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      course_id,
      module_id,
      lesson_id,
      quiz_id,
      include_global = 'true',
      limit,
      tenant_id,
      status,
      include_expired,
      search,
    } = req.query;

    const effectiveTenantId =
      req.isSuperAdmin && tenant_id ? tenant_id : req.tenantId;

    const parsedLimit = Math.min(
      Math.max(parseInt(String(limit ?? ''), 10) || 25, 1),
      200
    );

    const announcements = await listAnnouncements({
      viewerId: req.user.id,
      viewerRole: req.user.role,
      tenantId: effectiveTenantId,
      isSuperAdmin: req.isSuperAdmin,
      courseId: course_id,
      moduleId: module_id,
      lessonId: lesson_id,
      quizId: quiz_id,
      includeGlobal: include_global !== 'false',
      limit: parsedLimit,
      status: typeof status === 'string' ? status : undefined,
      includeExpired:
        include_expired === 'true' || include_expired === '1'
          ? true
          : false,
      search: typeof search === 'string' ? search : undefined,
    });

    res.json({
      success: true,
      data: announcements,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const announcement = await getAnnouncement(req.params.id, req.user.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found',
      });
    }

    // Enforce tenant isolation for non-super-admins
    if (!req.isSuperAdmin) {
      const belongsToTenant =
        !announcement.tenantId ||
        announcement.tenantId === req.tenantId;
      if (!belongsToTenant) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: announcement,
    });
  })
);

router.post(
  '/',
  requireRole(['super_admin', 'school_admin', 'instructor']),
  asyncHandler(async (req, res) => {
    const authorRole = req.user.primaryRole || req.user.role;
    const tenantId =
      req.isSuperAdmin && req.body.tenant_id
        ? req.body.tenant_id
        : req.tenantId;

    const announcement = await createAnnouncement(req.body, {
      authorId: req.user.id,
      authorRole,
      tenantId,
      sendEmail: req.body.send_email === true || req.body.sendEmail === true,
    });

    res.status(201).json({
      success: true,
      data: announcement,
    });
  })
);

router.put(
  '/:id',
  requireRole(['super_admin', 'school_admin', 'instructor']),
  asyncHandler(async (req, res) => {
    const updated = await updateAnnouncement(
      req.params.id,
      req.body,
      {
        actorId: req.user.id,
        actorRole: req.user.primaryRole || req.user.role,
        sendEmail: req.body.send_email === true || req.body.sendEmail === true,
      }
    );

    res.json({
      success: true,
      data: updated,
    });
  })
);

router.put(
  '/:id/archive',
  requireRole(['super_admin', 'school_admin']),
  asyncHandler(async (req, res) => {
    const archived = await archiveAnnouncement(
      req.params.id,
      req.user.primaryRole || req.user.role,
      req.user.id
    );

    res.json({
      success: true,
      data: archived,
    });
  })
);

router.delete(
  '/:id',
  requireRole(['super_admin']),
  asyncHandler(async (req, res) => {
    await deleteAnnouncement(req.params.id, req.user.primaryRole || req.user.role);

    res.json({
      success: true,
      data: { id: req.params.id },
    });
  })
);

router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const announcement = await markAnnouncementRead(req.params.id, req.user.id);

    res.json({
      success: true,
      data: announcement,
    });
  })
);

export default router;

