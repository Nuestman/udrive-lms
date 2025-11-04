import db from '../lib/db.js';
import bcrypt from 'bcrypt';

class SettingsService {
  /**
   * Get user settings and preferences
   */
  async getUserSettings(userId, tenantId) {
    try {
      // For super admin, don't restrict by tenant_id
      const userQuery = tenantId ? `
        SELECT 
          u.id,
          u.email,
          u.role,
          u.settings as user_settings,
          up.first_name,
          up.last_name,
          up.phone,
          up.avatar_url,
          up.profile_preferences,
          up.preferred_language,
          up.timezone
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1 AND u.tenant_id = $2
      ` : `
        SELECT 
          u.id,
          u.email,
          u.role,
          u.settings as user_settings,
          up.first_name,
          up.last_name,
          up.phone,
          up.avatar_url,
          up.profile_preferences,
          up.preferred_language,
          up.timezone
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1
      `;
      
      const result = await db.query(userQuery, tenantId ? [userId, tenantId] : [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      
      // Merge settings and preferences
      const userSettings = user.user_settings || {};
      const profilePreferences = user.profile_preferences || {};
      
      return {
        profile: {
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          preferredLanguage: user.preferred_language || 'en',
          timezone: user.timezone || 'UTC'
        },
        notifications: {
          emailNotifications: profilePreferences.email_notifications !== false,
          pushNotifications: profilePreferences.push_notifications !== false,
          courseUpdates: profilePreferences.course_updates !== false,
          assignmentReminders: profilePreferences.assignment_reminders !== false,
          systemAnnouncements: profilePreferences.system_announcements !== false
        },
        appearance: {
          theme: profilePreferences.theme || 'light',
          language: user.preferred_language || 'en',
          timezone: user.timezone || 'UTC',
          compactMode: profilePreferences.compact_mode || false
        },
        security: {
          twoFactorEnabled: userSettings.two_factor_enabled || false,
          lastPasswordChange: userSettings.last_password_change,
          loginNotifications: userSettings.login_notifications !== false
        }
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings and preferences
   */
  async updateUserSettings(userId, tenantId, settings) {
    try {
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Update user settings
        if (settings.security) {
          const userSettingsQuery = tenantId ? `
            UPDATE users 
            SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
                updated_at = NOW()
            WHERE id = $2 AND tenant_id = $3
            RETURNING settings
          ` : `
            UPDATE users 
            SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
                updated_at = NOW()
            WHERE id = $2
            RETURNING settings
          `;
          
          const userSettings = {
            two_factor_enabled: settings.security.twoFactorEnabled,
            login_notifications: settings.security.loginNotifications
          };
          
          await client.query(userSettingsQuery, tenantId ? [
            JSON.stringify(userSettings), 
            userId, 
            tenantId
          ] : [
            JSON.stringify(userSettings), 
            userId
          ]);
        }
        
        // Update profile preferences
        if (settings.profile || settings.notifications || settings.appearance) {
          const profilePreferences = {};
          
          if (settings.profile) {
            profilePreferences.preferred_language = settings.profile.preferredLanguage;
            profilePreferences.timezone = settings.profile.timezone;
          }
          
          if (settings.notifications) {
            profilePreferences.email_notifications = settings.notifications.emailNotifications;
            profilePreferences.push_notifications = settings.notifications.pushNotifications;
            profilePreferences.course_updates = settings.notifications.courseUpdates;
            profilePreferences.assignment_reminders = settings.notifications.assignmentReminders;
            profilePreferences.system_announcements = settings.notifications.systemAnnouncements;
          }
          
          if (settings.appearance) {
            profilePreferences.theme = settings.appearance.theme;
            profilePreferences.compact_mode = settings.appearance.compactMode;
          }
          
          // Update user profile
          const profileQuery = `
            UPDATE user_profiles 
            SET 
              first_name = COALESCE($1, first_name),
              last_name = COALESCE($2, last_name),
              phone = COALESCE($3, phone),
              avatar_url = COALESCE($4, avatar_url),
              profile_preferences = COALESCE(profile_preferences, '{}'::jsonb) || $5::jsonb,
              preferred_language = COALESCE($6, preferred_language),
              timezone = COALESCE($7, timezone),
              updated_at = NOW()
            WHERE user_id = $8
            RETURNING *
          `;
          
          await client.query(profileQuery, [
            settings.profile?.firstName,
            settings.profile?.lastName,
            settings.profile?.phone,
            settings.profile?.avatarUrl,
            JSON.stringify(profilePreferences),
            settings.profile?.preferredLanguage,
            settings.profile?.timezone,
            userId
          ]);
        }
        
        await client.query('COMMIT');
        
        // Return updated settings
        return await this.getUserSettings(userId, tenantId);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * Get tenant/school settings
   */
  async getTenantSettings(tenantId, isSuperAdmin) {
    try {
      // For super admin without tenant, return default settings
      if (!tenantId && isSuperAdmin) {
        return {
          basic: {
            name: 'System Default',
            subdomain: 'default',
            contactEmail: '',
            contactPhone: '',
            address: '',
            logoUrl: ''
          },
          preferences: {
            defaultLanguage: 'en',
            timezone: 'UTC',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            currency: 'USD'
          },
          notifications: {
            emailNotifications: true,
            smsNotifications: false,
            maintenanceNotifications: true,
            securityAlerts: true
          },
          features: {
            allowStudentRegistration: true,
            requireEmailVerification: true,
            enableProgressTracking: true,
            enableCertificates: true,
            enableQuizzes: true
          },
          subscription: {
            tier: 'enterprise',
            status: 'active'
          }
        };
      }

      const tenantQuery = `
        SELECT 
          id,
          name,
          subdomain,
          contact_email,
          contact_phone,
          address,
          settings,
          subscription_tier,
          subscription_status,
          logo_url
        FROM tenants 
        WHERE id = $1
      `;
      
      const result = await db.query(tenantQuery, [tenantId]);
      
      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }
      
      const tenant = result.rows[0];
      const settings = tenant.settings || {};
      
      return {
        basic: {
          name: tenant.name,
          subdomain: tenant.subdomain,
          contactEmail: tenant.contact_email,
          contactPhone: tenant.contact_phone,
          address: tenant.address,
          logoUrl: tenant.logo_url
        },
        preferences: {
          defaultLanguage: settings.default_language || 'en',
          timezone: settings.timezone || 'UTC',
          dateFormat: settings.date_format || 'YYYY-MM-DD',
          timeFormat: settings.time_format || '24h',
          currency: settings.currency || 'USD'
        },
        notifications: {
          emailNotifications: settings.email_notifications !== false,
          smsNotifications: settings.sms_notifications || false,
          maintenanceNotifications: settings.maintenance_notifications !== false,
          securityAlerts: settings.security_alerts !== false
        },
        features: {
          allowStudentRegistration: settings.allow_student_registration !== false,
          requireEmailVerification: settings.require_email_verification !== false,
          enableProgressTracking: settings.enable_progress_tracking !== false,
          enableCertificates: settings.enable_certificates !== false,
          enableQuizzes: settings.enable_quizzes !== false
        },
        subscription: {
          tier: tenant.subscription_tier,
          status: tenant.subscription_status
        }
      };
    } catch (error) {
      console.error('Error getting tenant settings:', error);
      throw error;
    }
  }

  /**
   * Update tenant/school settings
   */
  async updateTenantSettings(tenantId, settings, isSuperAdmin) {
    try {
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Update basic tenant info
        if (settings.basic) {
          const basicQuery = `
            UPDATE tenants 
            SET 
              name = COALESCE($1, name),
              contact_email = COALESCE($2, contact_email),
              contact_phone = COALESCE($3, contact_phone),
              address = COALESCE($4, address),
              logo_url = COALESCE($5, logo_url),
              updated_at = NOW()
            WHERE id = $6
          `;
          
          await client.query(basicQuery, [
            settings.basic.name,
            settings.basic.contactEmail,
            settings.basic.contactPhone,
            settings.basic.address,
            settings.basic.logoUrl,
            tenantId
          ]);
        }
        
        // Update tenant settings
        if (settings.preferences || settings.notifications || settings.features) {
          const tenantSettings = {};
          
          if (settings.preferences) {
            tenantSettings.default_language = settings.preferences.defaultLanguage;
            tenantSettings.timezone = settings.preferences.timezone;
            tenantSettings.date_format = settings.preferences.dateFormat;
            tenantSettings.time_format = settings.preferences.timeFormat;
            tenantSettings.currency = settings.preferences.currency;
          }
          
          if (settings.notifications) {
            tenantSettings.email_notifications = settings.notifications.emailNotifications;
            tenantSettings.sms_notifications = settings.notifications.smsNotifications;
            tenantSettings.maintenance_notifications = settings.notifications.maintenanceNotifications;
            tenantSettings.security_alerts = settings.notifications.securityAlerts;
          }
          
          if (settings.features) {
            tenantSettings.allow_student_registration = settings.features.allowStudentRegistration;
            tenantSettings.require_email_verification = settings.features.requireEmailVerification;
            tenantSettings.enable_progress_tracking = settings.features.enableProgressTracking;
            tenantSettings.enable_certificates = settings.features.enableCertificates;
            tenantSettings.enable_quizzes = settings.features.enableQuizzes;
          }
          
          const settingsQuery = `
            UPDATE tenants 
            SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb,
                updated_at = NOW()
            WHERE id = $2
          `;
          
          await client.query(settingsQuery, [
            JSON.stringify(tenantSettings), 
            tenantId
          ]);
        }
        
        await client.query('COMMIT');
        
        // Return updated settings
        return await this.getTenantSettings(tenantId, isSuperAdmin);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating tenant settings:', error);
      throw error;
    }
  }

  /**
   * Get system-wide settings (super admin only)
   */
  async getSystemSettings() {
    try {
      // For now, return default system settings
      // In a real implementation, these would be stored in a system_settings table
      return {
        platform: {
          name: 'UDrive LMS',
          version: '1.0.0',
          maintenanceMode: false,
          registrationEnabled: true
        },
        security: {
          passwordMinLength: 8,
          requireStrongPasswords: true,
          sessionTimeout: 24, // hours
          maxLoginAttempts: 5,
          lockoutDuration: 15 // minutes
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true
        },
        features: {
          multiTenant: true,
          analytics: true,
          certificates: true,
          progressTracking: true,
          quizEngine: true
        }
      };
    } catch (error) {
      console.error('Error getting system settings:', error);
      throw error;
    }
  }

  /**
   * Update system-wide settings (super admin only)
   */
  async updateSystemSettings(settings) {
    try {
      // For now, just return the updated settings
      // In a real implementation, these would be stored in a system_settings table
      console.log('System settings updated:', settings);
      return settings;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current user
      const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
      const userResult = await db.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      const updateQuery = `
        UPDATE users 
        SET 
          password_hash = $1,
          settings = COALESCE(settings, '{}'::jsonb) || '{"last_password_change": "' || NOW() || '"}'::jsonb,
          updated_at = NOW()
        WHERE id = $2
      `;
      
      await db.query(updateQuery, [newPasswordHash, userId]);
      
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Reset notification preferences to defaults
   */
  async resetNotificationPreferences(userId) {
    try {
      const defaultPreferences = {
        email_notifications: true,
        push_notifications: false,
        course_updates: true,
        assignment_reminders: true,
        system_announcements: true
      };
      
      const updateQuery = `
        UPDATE user_profiles 
        SET 
          profile_preferences = COALESCE(profile_preferences, '{}'::jsonb) || $1::jsonb,
          updated_at = NOW()
        WHERE user_id = $2
      `;
      
      await db.query(updateQuery, [JSON.stringify(defaultPreferences), userId]);
      
    } catch (error) {
      console.error('Error resetting notification preferences:', error);
      throw error;
    }
  }
}

export default new SettingsService();
