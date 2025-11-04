import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth as authMiddleware } from '../middleware/auth.middleware.js';
import { tenantContext as tenantMiddleware } from '../middleware/tenant.middleware.js';
import settingsService from '../services/settings.service.js';

const router = express.Router();

// Apply authentication and tenant middleware
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * GET /api/settings/user
 * Get current user's settings and preferences
 */
router.get('/user', asyncHandler(async (req, res) => {
  const settings = await settingsService.getUserSettings(req.user.id, req.tenantId);
  
  res.json({
    success: true,
    data: settings
  });
}));

/**
 * PUT /api/settings/user
 * Update current user's settings and preferences
 */
router.put('/user', asyncHandler(async (req, res) => {
  const updatedSettings = await settingsService.updateUserSettings(
    req.user.id, 
    req.tenantId, 
    req.body
  );
  
  res.json({
    success: true,
    data: updatedSettings,
    message: 'Settings updated successfully'
  });
}));

/**
 * GET /api/settings/tenant
 * Get tenant/school settings (school admin and super admin only)
 */
router.get('/tenant', asyncHandler(async (req, res) => {
  if (!['super_admin', 'school_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. School admin or super admin role required.'
    });
  }

  const settings = await settingsService.getTenantSettings(req.tenantId, req.isSuperAdmin);
  
  res.json({
    success: true,
    data: settings
  });
}));

/**
 * PUT /api/settings/tenant
 * Update tenant/school settings (school admin and super admin only)
 */
router.put('/tenant', asyncHandler(async (req, res) => {
  if (!['super_admin', 'school_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. School admin or super admin role required.'
    });
  }

  const updatedSettings = await settingsService.updateTenantSettings(
    req.tenantId, 
    req.body, 
    req.isSuperAdmin
  );
  
  res.json({
    success: true,
    data: updatedSettings,
    message: 'School settings updated successfully'
  });
}));

/**
 * GET /api/settings/system
 * Get system-wide settings (super admin only)
 */
router.get('/system', asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Super admin role required.'
    });
  }

  const settings = await settingsService.getSystemSettings();
  
  res.json({
    success: true,
    data: settings
  });
}));

/**
 * PUT /api/settings/system
 * Update system-wide settings (super admin only)
 */
router.put('/system', asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Super admin role required.'
    });
  }

  const updatedSettings = await settingsService.updateSystemSettings(req.body);
  
  res.json({
    success: true,
    data: updatedSettings,
    message: 'System settings updated successfully'
  });
}));

/**
 * POST /api/settings/change-password
 * Change user password
 */
router.post('/change-password', asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
  }

  await settingsService.changePassword(req.user.id, currentPassword, newPassword);
  
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

/**
 * POST /api/settings/reset-notifications
 * Reset notification preferences to defaults
 */
router.post('/reset-notifications', asyncHandler(async (req, res) => {
  await settingsService.resetNotificationPreferences(req.user.id);
  
  res.json({
    success: true,
    message: 'Notification preferences reset to defaults'
  });
}));

export default router;
