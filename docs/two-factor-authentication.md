# Two-Factor Authentication (2FA) Documentation

## Overview

The SunLMS Two-Factor Authentication system provides enhanced security through Time-based One-Time Password (TOTP) authentication. Users can enable 2FA using authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator, adding an extra layer of security to their accounts.

## Architecture

### Frontend Components

#### TwoFactorSetupModal
```typescript
import TwoFactorSetupModal from './components/settings/TwoFactorSetupModal';

// 2FA setup modal in security settings
<TwoFactorSetupModal
  isOpen={showTwoFactorModal}
  onClose={() => setShowTwoFactorModal(false)}
/>
```

#### SecuritySettingsModal Integration
```typescript
// Integration with security settings
const SecuritySettingsModal = () => {
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  
  return (
    <div>
      {/* 2FA Section */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            {securitySettings.twoFactorEnabled && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Enabled</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowTwoFactorModal(true)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100"
        >
          <Settings className="w-4 h-4" />
          <span>{securitySettings.twoFactorEnabled ? 'Manage' : 'Setup'}</span>
        </button>
      </div>
      
      {/* 2FA Setup Modal */}
      <TwoFactorSetupModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
      />
    </div>
  );
};
```

### Backend Services

#### TwoFactorAuthService
```javascript
import speakeasy from 'speakeasy';
import { query } from '../lib/db.js';
import { sendTemplatedEmail, isEmailConfigured } from '../utils/mailer.js';
import { buildNotification } from '../utils/notificationTemplates.js';
import notificationsService from './notifications.service.js';

class TwoFactorAuthService {
  /**
   * Generate a new 2FA secret for a user
   */
  async generateSecret(userId) {
    try {
      const secret = speakeasy.generateSecret({
        name: 'SunLMS',
        issuer: 'SunLMS',
        length: 32
      });

      // Store secret temporarily (not enabled yet)
      await query(
        `UPDATE users 
         SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [
          JSON.stringify({ 
            two_factor_secret: secret.base32,
            two_factor_enabled: false,
            two_factor_verified: false
          }), 
          userId
        ]
      );

      return {
        success: true,
        secret: secret.base32,
        qrCode: secret.otpauth_url
      };
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Verify 2FA token and enable 2FA
   */
  async verifyAndEnable(userId, token) {
    try {
      // Get user's secret
      const result = await query('SELECT settings FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const settings = result.rows[0].settings || {};
      const secret = settings.two_factor_secret;

      if (!secret) {
        throw new Error('No 2FA secret found. Please generate a new one.');
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps (60 seconds) of tolerance
      });

      if (verified) {
        // Enable 2FA
        await query(
          `UPDATE users 
           SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
               updated_at = NOW()
           WHERE id = $2`,
          [
            JSON.stringify({ 
              two_factor_enabled: true,
              two_factor_verified: true,
              two_factor_enabled_at: new Date().toISOString()
            }), 
            userId
          ]
        );

        // Send email notification
        try {
          const userResult = await query(
            'SELECT email, p.first_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1',
            [userId]
          );
          
          if (userResult.rows.length > 0 && isEmailConfigured()) {
            const user = userResult.rows[0];
            await sendTemplatedEmail('2fa_enabled', {
              to: user.email,
              variables: {
                firstName: user.first_name || 'User',
                timestamp: new Date().toLocaleString()
              }
            });
          }
          
          // Create in-app notification
          const notification = buildNotification('2fa_enabled', {
            firstName: user.first_name || 'User',
            timestamp: new Date().toLocaleString()
          });
          
          await notificationsService.createNotification(userId, {
            type: '2fa_enabled',
            title: notification.title,
            message: notification.body,
            link: '/settings'
          });
        } catch (emailError) {
          console.error('Failed to send 2FA enabled notification:', emailError);
        }

        return { success: true, message: '2FA enabled successfully' };
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disable(userId) {
    try {
      await query(
        `UPDATE users 
         SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [
          JSON.stringify({ 
            two_factor_enabled: false,
            two_factor_verified: false,
            two_factor_secret: null,
            two_factor_disabled_at: new Date().toISOString()
          }), 
          userId
        ]
      );

      // Send email notification
      try {
        const userResult = await query(
          'SELECT email, p.first_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1',
          [userId]
        );
        
        if (userResult.rows.length > 0 && isEmailConfigured()) {
          const user = userResult.rows[0];
          await sendTemplatedEmail('2fa_disabled', {
            to: user.email,
            variables: {
              firstName: user.first_name || 'User',
              timestamp: new Date().toLocaleString()
            }
          });
        }
        
        // Create in-app notification
        const notification = buildNotification('2fa_disabled', {
          firstName: user.first_name || 'User',
          timestamp: new Date().toLocaleString()
        });
        
        await notificationsService.createNotification(userId, {
          type: '2fa_disabled',
          title: notification.title,
          message: notification.body,
          link: '/settings'
        });
      } catch (emailError) {
        console.error('Failed to send 2FA disabled notification:', emailError);
      }

      return { success: true, message: '2FA disabled successfully' };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Verify a 2FA token during login
   */
  async verifyToken(userId, token) {
    try {
      const result = await query('SELECT settings FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const settings = result.rows[0].settings || {};
      const secret = settings.two_factor_secret;

      if (!secret) {
        throw new Error('2FA not enabled for this user');
      }

      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      return { success: verified, message: verified ? 'Token verified' : 'Invalid token' };
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      throw new Error('Failed to verify 2FA token');
    }
  }

  /**
   * Get 2FA status for a user
   */
  async getStatus(userId) {
    try {
      const result = await query('SELECT settings FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const settings = result.rows[0].settings || {};
      return {
        success: true,
        data: {
          enabled: settings.two_factor_enabled || false,
          verified: settings.two_factor_verified || false,
          enabledAt: settings.two_factor_enabled_at || null
        }
      };
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      throw new Error('Failed to get 2FA status');
    }
  }
}

export default new TwoFactorAuthService();
```

## API Endpoints

### 2FA Routes
```javascript
// server/routes/twoFactorAuth.js
import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import twoFactorAuthService from '../services/twoFactorAuth.service.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route POST /api/2fa/generate
 * @desc Generate a new 2FA secret and QR code
 * @access Private
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const { user } = req;
  
  const result = await twoFactorAuthService.generateSecret(user.id);
  
  res.json({
    success: true,
    data: result
  });
}));

/**
 * @route POST /api/2fa/verify
 * @desc Verify 2FA token and enable 2FA
 * @access Private
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { user } = req;
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    });
  }
  
  const result = await twoFactorAuthService.verifyAndEnable(user.id, token);
  
  res.json({
    success: true,
    message: result.message
  });
}));

/**
 * @route POST /api/2fa/disable
 * @desc Disable 2FA for the user
 * @access Private
 */
router.post('/disable', asyncHandler(async (req, res) => {
  const { user } = req;
  
  const result = await twoFactorAuthService.disable(user.id);
  
  res.json({
    success: true,
    message: result.message
  });
}));

/**
 * @route GET /api/2fa/status
 * @desc Get 2FA status for the user
 * @access Private
 */
router.get('/status', asyncHandler(async (req, res) => {
  const { user } = req;
  
  const result = await twoFactorAuthService.getStatus(user.id);
  
  res.json(result);
}));

export default router;
```

## Frontend Implementation

### TwoFactorSetupModal Component
```typescript
// TwoFactorSetupModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Download, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'generate' | 'verify' | 'success'>('generate');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate 2FA secret and QR code
  const generateSecret = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/2fa/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSecret(data.data.secret);
        
        // Generate QR code
        const qrCodeDataURL = await QRCode.toDataURL(data.data.qrCode);
        setQrCode(qrCodeDataURL);
        
        setStep('verify');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate 2FA secret');
      }
    } catch (error) {
      setError('Failed to generate 2FA secret');
      console.error('Error generating 2FA secret:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verify 2FA token
  const verifyToken = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (response.ok) {
        setStep('success');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Failed to verify code');
      console.error('Error verifying 2FA token:', error);
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const disable2FA = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        onClose();
        // Refresh the page or update state to reflect 2FA disabled
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Failed to disable 2FA');
      console.error('Error disabling 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('generate');
      setSecret('');
      setQrCode('');
      setVerificationCode('');
      setShowSecret(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Two-Factor Authentication
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'generate' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Enable Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add an extra layer of security to your account
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Before you start:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Install an authenticator app like Google Authenticator or Authy</li>
                      <li>Make sure you have access to your phone</li>
                      <li>Keep backup codes in a safe place</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={generateSecret}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Start Setup'}
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Scan QR Code
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use your authenticator app to scan this QR code
                </p>
              </div>

              {qrCode && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border">
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or enter this code manually:
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md font-mono text-sm">
                      {showSecret ? secret : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter verification code:
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('generate')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Back
                </button>
                <button
                  onClick={verifyToken}
                  disabled={loading || verificationCode.length !== 6}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Two-Factor Authentication Enabled
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your account is now protected with 2FA. You'll need to enter a verification code each time you log in.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Keep your authenticator app secure</li>
                      <li>Save backup codes in a safe place</li>
                      <li>Contact support if you lose access to your device</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetupModal;
```

## Email Notifications

### 2FA Email Templates
```javascript
// Email templates for 2FA events
const emailTemplates = {
  '2fa_enabled': ({ firstName, timestamp, appName = 'SunLMS' }) => ({
    subject: `Two-Factor Authentication Enabled - ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Two-Factor Authentication Enabled</h2>
        <p>Hi ${firstName},</p>
        <p>Two-factor authentication (2FA) has been successfully enabled for your ${appName} account on ${timestamp}.</p>
        <p>This adds an extra layer of security to your account by requiring a verification code from your authenticator app when logging in.</p>
        <p><strong>Important Security Information:</strong></p>
        <ul>
          <li>Keep your authenticator app secure and backed up</li>
          <li>You'll need to enter a 6-digit code from your app each time you log in</li>
          <li>If you lose access to your authenticator app, contact support immediately</li>
        </ul>
        <p>If you did not enable 2FA on your account, please contact our support team immediately as your account may be compromised.</p>
        <p>Best regards,<br>The ${appName} Security Team</p>
      </div>
    `,
    text: `Two-Factor Authentication Enabled - ${appName}\n\nHi ${firstName},\n\nTwo-factor authentication (2FA) has been successfully enabled for your ${appName} account on ${timestamp}.\n\nThis adds an extra layer of security to your account by requiring a verification code from your authenticator app when logging in.\n\nImportant Security Information:\n- Keep your authenticator app secure and backed up\n- You'll need to enter a 6-digit code from your app each time you log in\n- If you lose access to your authenticator app, contact support immediately\n\nIf you did not enable 2FA on your account, please contact our support team immediately as your account may be compromised.\n\nBest regards,\nThe ${appName} Security Team`
  }),

  '2fa_disabled': ({ firstName, timestamp, appName = 'SunLMS' }) => ({
    subject: `Two-Factor Authentication Disabled - ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Two-Factor Authentication Disabled</h2>
        <p>Hi ${firstName},</p>
        <p>Two-factor authentication (2FA) has been disabled for your ${appName} account on ${timestamp}.</p>
        <p><strong>Security Notice:</strong> Your account is now less secure without 2FA enabled. We strongly recommend re-enabling it as soon as possible.</p>
        <p>To re-enable 2FA:</p>
        <ol>
          <li>Log into your account</li>
          <li>Go to Settings → Security</li>
          <li>Click "Setup 2FA" and follow the instructions</li>
        </ol>
        <p>If you did not disable 2FA on your account, please contact our support team immediately as your account may be compromised.</p>
        <p>Best regards,<br>The ${appName} Security Team</p>
      </div>
    `,
    text: `Two-Factor Authentication Disabled - ${appName}\n\nHi ${firstName},\n\nTwo-factor authentication (2FA) has been disabled for your ${appName} account on ${timestamp}.\n\nSecurity Notice: Your account is now less secure without 2FA enabled. We strongly recommend re-enabling it as soon as possible.\n\nTo re-enable 2FA:\n1. Log into your account\n2. Go to Settings → Security\n3. Click "Setup 2FA" and follow the instructions\n\nIf you did not disable 2FA on your account, please contact our support team immediately as your account may be compromised.\n\nBest regards,\nThe ${appName} Security Team`
  })
};
```

## Database Schema

### User Settings Storage
```sql
-- 2FA settings are stored in the users.settings JSONB column
-- Example structure:
{
  "two_factor_enabled": true,
  "two_factor_verified": true,
  "two_factor_secret": "JBSWY3DPEHPK3PXP",
  "two_factor_enabled_at": "2024-01-01T12:00:00Z",
  "two_factor_disabled_at": null
}
```

### Security Audit Log
```sql
-- Optional: Create a security audit log table
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- '2fa_enabled', '2fa_disabled', '2fa_verified'
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX idx_security_audit_log_created_at ON security_audit_log(created_at DESC);
```

## Security Considerations

### Secret Storage
- **Encryption**: 2FA secrets are stored in the database but should be encrypted at rest
- **Access Control**: Only the user and system can access their 2FA secret
- **Cleanup**: Secrets are removed when 2FA is disabled

### Token Validation
- **Time Window**: 2-step tolerance (60 seconds) for clock drift
- **Rate Limiting**: Prevent brute force attacks on 2FA tokens
- **Audit Logging**: Log all 2FA attempts for security monitoring

### Backup and Recovery
- **Backup Codes**: Generate backup codes for account recovery
- **Support Process**: Clear process for users who lose access to their authenticator
- **Account Recovery**: Secure account recovery process for locked accounts

## Testing

### Unit Tests
```javascript
// Test 2FA service functions
describe('TwoFactorAuthService', () => {
  test('should generate valid TOTP secret', async () => {
    const result = await twoFactorAuthService.generateSecret('user-123');
    expect(result.success).toBe(true);
    expect(result.secret).toBeDefined();
    expect(result.qrCode).toBeDefined();
  });

  test('should verify valid TOTP token', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const token = speakeasy.totp({ secret, encoding: 'base32' });
    
    const result = await twoFactorAuthService.verifyToken('user-123', token);
    expect(result.success).toBe(true);
  });

  test('should reject invalid TOTP token', async () => {
    const result = await twoFactorAuthService.verifyToken('user-123', '123456');
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests
```javascript
// Test 2FA API endpoints
describe('2FA API', () => {
  test('POST /api/2fa/generate should return secret and QR code', async () => {
    const response = await request(app)
      .post('/api/2fa/generate')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.secret).toBeDefined();
    expect(response.body.data.qrCode).toBeDefined();
  });

  test('POST /api/2fa/verify should enable 2FA with valid token', async () => {
    // First generate a secret
    const generateResponse = await request(app)
      .post('/api/2fa/generate')
      .set('Authorization', `Bearer ${validToken}`);

    const secret = generateResponse.body.data.secret;
    const token = speakeasy.totp({ secret, encoding: 'base32' });

    // Then verify the token
    const response = await request(app)
      .post('/api/2fa/verify')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ token })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

#### QR Code Not Displaying
```typescript
// Debug QR code generation
const debugQRCode = async () => {
  try {
    const response = await fetch('/api/2fa/generate');
    const data = await response.json();
    
    console.log('Secret:', data.data.secret);
    console.log('QR Code URL:', data.data.qrCode);
    
    // Test QR code generation
    const qrCodeDataURL = await QRCode.toDataURL(data.data.qrCode);
    console.log('Generated QR Code:', qrCodeDataURL);
  } catch (error) {
    console.error('QR Code generation error:', error);
  }
};
```

#### Token Verification Failing
```typescript
// Debug token verification
const debugTokenVerification = (secret, token) => {
  console.log('Secret:', secret);
  console.log('Token:', token);
  
  // Check if secret is valid
  try {
    const testToken = speakeasy.totp({ secret, encoding: 'base32' });
    console.log('Generated token:', testToken);
    console.log('Token matches:', testToken === token);
  } catch (error) {
    console.error('Token generation error:', error);
  }
  
  // Check time synchronization
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  console.log('Current time step:', timeStep);
};
```

#### Email Notifications Not Sending
```javascript
// Debug email notifications
const debugEmailNotifications = async (userId) => {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      console.log('Email service not configured');
      return;
    }
    
    // Check user email
    const user = await getUserById(userId);
    console.log('User email:', user.email);
    
    // Test email sending
    await sendTemplatedEmail('2fa_enabled', {
      to: user.email,
      variables: {
        firstName: user.first_name || 'User',
        timestamp: new Date().toLocaleString()
      }
    });
    
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email sending error:', error);
  }
};
```

## Future Enhancements

### Planned Features
- **Backup Codes**: Generate and manage backup recovery codes
- **Multiple Devices**: Support for multiple authenticator devices
- **Hardware Keys**: Support for FIDO2/WebAuthn hardware keys
- **SMS Backup**: SMS as backup authentication method
- **Biometric Support**: Fingerprint and face recognition support
- **Advanced Security**: Risk-based authentication
- **Admin Controls**: Admin ability to enforce 2FA for all users
- **Analytics**: 2FA usage analytics and security insights

### Integration Opportunities
- **SSO Integration**: 2FA integration with SAML/OAuth providers
- **Mobile Apps**: Native mobile app 2FA support
- **API Security**: 2FA for API access
- **Admin Dashboard**: 2FA management for administrators
- **Compliance**: GDPR, SOC2 compliance features
- **Audit Logging**: Enhanced security audit capabilities
- **Risk Assessment**: AI-powered risk assessment
- **Emergency Access**: Emergency access procedures
