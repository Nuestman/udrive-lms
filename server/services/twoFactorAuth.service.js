import speakeasy from 'speakeasy';
import { query } from '../lib/db.js';
import { sendTemplatedEmail, isEmailConfigured } from '../utils/mailer.js';
import { buildNotification } from '../utils/notificationTemplates.js';
import notificationsService from './notifications.service.js';

class TwoFactorAuthService {
  /**
   * Generate a new 2FA secret for a user
   */
  async generateSecret(userId, userEmail) {
    try {
      const secret = speakeasy.generateSecret({
        name: `SunLMS (${userEmail})`,
        issuer: 'SunLMS',
        length: 32
      });

      // Store the secret in the database (temporarily until verified)
      await query(
        `UPDATE users 
         SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [
          JSON.stringify({ 
            two_factor_secret: secret.base32,
            two_factor_verified: false 
          }), 
          userId
        ]
      );

      return {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
        manualEntryKey: secret.base32
      };
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Verify a 2FA token and enable 2FA for the user
   */
  async verifyAndEnable(userId, token) {
    try {
      // Get the user's 2FA secret
      const result = await query(
        'SELECT settings FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const settings = result.rows[0].settings || {};
      const secret = settings.two_factor_secret;

      if (!secret) {
        throw new Error('No 2FA secret found. Please generate a new one.');
      }

      // Verify the token
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

        // Send email notification and create in-app notification
        try {
          const userResult = await query(
            'SELECT email, p.first_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1',
            [userId]
          );
          
          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            
            // Send email
            if (isEmailConfigured()) {
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
          }
        } catch (emailError) {
          console.error('Failed to send 2FA enabled notification:', emailError);
          // Don't fail the 2FA enable process if notification fails
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

      // Send email notification and create in-app notification
      try {
        const userResult = await query(
          'SELECT email, p.first_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1',
          [userId]
        );
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          
          // Send email
          if (isEmailConfigured()) {
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
        }
      } catch (emailError) {
        console.error('Failed to send 2FA disabled notification:', emailError);
        // Don't fail the 2FA disable process if notification fails
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
      // Get the user's 2FA secret
      const result = await query(
        'SELECT settings FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const settings = result.rows[0].settings || {};
      const secret = settings.two_factor_secret;
      const isEnabled = settings.two_factor_enabled;

      if (!isEnabled) {
        return { success: true, message: '2FA not enabled' };
      }

      if (!secret) {
        throw new Error('2FA is enabled but no secret found');
      }

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps (60 seconds) of tolerance
      });

      if (verified) {
        return { success: true, message: '2FA token verified' };
      } else {
        throw new Error('Invalid 2FA token');
      }
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      throw error;
    }
  }

  /**
   * Get 2FA status for a user
   */
  async getStatus(userId) {
    try {
      const result = await query(
        'SELECT settings FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const settings = result.rows[0].settings || {};
      
      return {
        enabled: settings.two_factor_enabled || false,
        verified: settings.two_factor_verified || false,
        enabledAt: settings.two_factor_enabled_at || null
      };
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      throw new Error('Failed to get 2FA status');
    }
  }
}

export default new TwoFactorAuthService();
