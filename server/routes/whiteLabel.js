import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import whiteLabelService from '../services/whiteLabel.service.js';

const router = express.Router();

// Apply authentication and tenant middleware to all routes
router.use(requireAuth);
router.use(tenantContext);

/**
 * @route GET /api/settings/white-label
 * @desc Get white label settings
 * @access Private (Super Admin, School Admin)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { user, tenantId } = req;
  
  console.log('🔍 White Label Settings Get Debug:');
  console.log('   User:', user);
  console.log('   Tenant ID:', tenantId);
  
  // Check permissions
  if (!['super_admin', 'school_admin'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }

  try {
    const settings = await whiteLabelService.getWhiteLabelSettings(tenantId, user.role);
    
    console.log('✅ White label settings loaded successfully:', settings);
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('❌ White label settings load error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load white label settings'
    });
  }
}));

/**
 * @route PUT /api/settings/white-label
 * @desc Update white label settings
 * @access Private (Super Admin, School Admin)
 */
router.put('/', asyncHandler(async (req, res) => {
  const { user, tenantId } = req;
  const settings = req.body;
  
  console.log('🔍 White Label Settings Update Debug:');
  console.log('   User:', user);
  console.log('   Tenant ID:', tenantId);
  console.log('   Settings:', settings);
  
  // Check permissions
  if (!['super_admin', 'school_admin'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }

  try {
    const updatedSettings = await whiteLabelService.updateWhiteLabelSettings(
      tenantId, 
      user.role, 
      settings
    );
    
    console.log('✅ White label settings updated successfully:', updatedSettings);
    
    res.json({
      success: true,
      settings: updatedSettings,
      message: 'White label settings updated successfully'
    });
  } catch (error) {
    console.error('❌ White label settings update error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update white label settings'
    });
  }
}));

/**
 * @route POST /api/upload/branding
 * @desc Upload branding assets (logo, favicon)
 * @access Private (Super Admin, School Admin)
 */
router.post('/upload/branding', asyncHandler(async (req, res) => {
  const { user, tenantId } = req;
  
  // Check permissions
  if (!['super_admin', 'school_admin'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }

  // This would typically use multer middleware for file uploads
  // For now, we'll return a mock response
  const { type } = req.body;
  
  // In a real implementation, you would:
  // 1. Validate file type and size
  // 2. Upload to cloud storage (AWS S3, etc.)
  // 3. Return the public URL
  
  const mockUrl = `/uploads/branding/${tenantId || 'system'}/${type}-${Date.now()}.png`;
  
  res.json({
    success: true,
    url: mockUrl,
    message: 'File uploaded successfully'
  });
}));

export default router;
