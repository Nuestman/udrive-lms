import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth as authMiddleware } from '../middleware/auth.middleware.js';
import { tenantContext as tenantMiddleware } from '../middleware/tenant.middleware.js';
import twoFactorAuthService from '../services/twoFactorAuth.service.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * GET /api/2fa/status
 * Get 2FA status for the current user
 */
router.get('/status', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const status = await twoFactorAuthService.getStatus(userId);
  
  res.json({
    success: true,
    data: status
  });
}));

/**
 * POST /api/2fa/generate
 * Generate a new 2FA secret and QR code
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  
  const result = await twoFactorAuthService.generateSecret(userId, userEmail);
  
  res.json({
    success: true,
    data: result
  });
}));

/**
 * POST /api/2fa/verify
 * Verify a 2FA token and enable 2FA
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Verification token is required'
    });
  }
  
  const result = await twoFactorAuthService.verifyAndEnable(userId, token);
  
  res.json({
    success: true,
    data: result
  });
}));

/**
 * POST /api/2fa/disable
 * Disable 2FA for the current user
 */
router.post('/disable', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const result = await twoFactorAuthService.disable(userId);
  
  res.json({
    success: true,
    data: result
  });
}));

/**
 * POST /api/2fa/verify-login
 * Verify 2FA token during login (used by auth service)
 */
router.post('/verify-login', asyncHandler(async (req, res) => {
  const { userId, token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json({
      success: false,
      error: 'User ID and token are required'
    });
  }
  
  const result = await twoFactorAuthService.verifyToken(userId, token);
  
  res.json({
    success: true,
    data: result
  });
}));

export default router;
