// Modules Routes
import express from 'express';
import modulesService from '../services/modules.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { permissions } from '../middleware/rbac.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createNotification } from '../services/notifications.service.js';

const router = express.Router();

// All routes require authentication and tenant context
router.use(requireAuth);
router.use(tenantContext);

/**
 * GET /api/courses/:courseId/modules
 * Get all modules for a course
 */
router.get('/course/:courseId', asyncHandler(async (req, res) => {
  const modules = await modulesService.getModulesByCourse(req.params.courseId, req.tenantId);
  
  res.json({
    success: true,
    data: modules
  });
}));

/**
 * GET /api/modules/:id
 * Get single module
 * - Super Admin: Any module
 * - Others: Only if in their school
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const module = await modulesService.getModuleById(req.params.id, req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: module
  });
}));

/**
 * POST /api/modules
 * Create new module
 */
router.post('/', asyncHandler(async (req, res) => {
  console.log('📦 [MODULE-CREATE] Module creation request received:', { 
    userId: req.user.id, 
    userEmail: req.user.email,
    moduleTitle: req.body.title,
    courseId: req.body.course_id
  });
  
  const module = await modulesService.createModule(req.body, req.tenantId);
  console.log('📦 [MODULE-CREATE] Module created successfully:', { 
    moduleId: module.id, 
    moduleTitle: module.title,
    courseId: module.course_id
  });
  
  // Create notification for module creation
  const io = req.app.get('io');
  try {
    await createNotification(req.user.id, {
      type: 'success',
      title: 'Module Created',
      message: `Module "${module.title}" has been created successfully.`,
      link: `/courses/${module.course_id}/modules/${module.id}`,
      data: { moduleId: module.id, moduleTitle: module.title, courseId: module.course_id }
    }, io);
    console.log('📦 [MODULE-CREATE] Notification created successfully');
  } catch (notificationError) {
    console.error('📦 [MODULE-CREATE] Failed to create notification:', notificationError);
  }
  
  res.status(201).json({
    success: true,
    data: module,
    message: 'Module created successfully'
  });
}));

/**
 * PUT /api/modules/:id
 * Update module
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const module = await modulesService.updateModule(req.params.id, req.body, req.tenantId, io);
  
  res.json({
    success: true,
    data: module,
    message: 'Module updated successfully'
  });
}));

/**
 * DELETE /api/modules/:id
 * Delete module
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await modulesService.deleteModule(req.params.id, req.tenantId);
  
  res.json({
    success: true,
    message: 'Module deleted successfully'
  });
}));

/**
 * POST /api/courses/:courseId/modules/reorder
 * Reorder modules
 */
router.post('/course/:courseId/reorder', asyncHandler(async (req, res) => {
  await modulesService.reorderModules(req.params.courseId, req.body.moduleOrders, req.tenantId);
  
  res.json({
    success: true,
    message: 'Modules reordered successfully'
  });
}));

export default router;

