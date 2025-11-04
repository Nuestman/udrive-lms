import { query } from '../lib/db.js';

class WhiteLabelService {
  /**
   * Get white label settings for a tenant
   */
  async getWhiteLabelSettings(tenantId, userRole) {
    try {
      // For super admin without tenant, return system-wide settings
      if (!tenantId && userRole === 'super_admin') {
        return this.getDefaultWhiteLabelSettings();
      }

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const result = await query(
        'SELECT white_label_settings FROM tenants WHERE id = $1',
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      const settings = result.rows[0].white_label_settings || {};
      return this.mergeWithDefaults(settings);
    } catch (error) {
      console.error('Error getting white label settings:', error);
      throw error;
    }
  }

  /**
   * Update white label settings for a tenant
   */
  async updateWhiteLabelSettings(tenantId, userRole, settings) {
    try {
      // For super admin without tenant, update system-wide settings
      if (!tenantId && userRole === 'super_admin') {
        return this.updateSystemWhiteLabelSettings(settings);
      }

      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      // Validate settings
      const validatedSettings = this.validateSettings(settings);

      // Update tenant settings
      await query(
        `UPDATE tenants 
         SET white_label_settings = $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(validatedSettings), tenantId]
      );

      return this.mergeWithDefaults(validatedSettings);
    } catch (error) {
      console.error('Error updating white label settings:', error);
      throw error;
    }
  }

  /**
   * Get default white label settings
   */
  getDefaultWhiteLabelSettings() {
    return {
      // Branding
      logoUrl: '/sunlms-logo-wide.png',
      faviconUrl: '/favicon.ico',
      companyName: 'SunLMS',
      primaryColor: '#0F52BA',
      secondaryColor: '#00A9A5',
      accentColor: '#FF7F00',
      
      // Customization
      customCss: '',
      hidePoweredBy: false,
      customFooterText: '',
      
      // Domain & URLs
      customDomain: '',
      supportEmail: '',
      supportUrl: '',
      
      // Features
      enableCustomBranding: false,
      enableCustomDomain: false,
      enableCustomSupport: false,
    };
  }

  /**
   * Update system-wide white label settings
   */
  async updateSystemWhiteLabelSettings(settings) {
    try {
      const validatedSettings = this.validateSettings(settings);
      
      // Store in a system settings table or configuration
      // For now, we'll use a simple approach
      await query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ('white_label', $1::jsonb, NOW())
         ON CONFLICT (key) 
         DO UPDATE SET value = $1::jsonb, updated_at = NOW()`,
        [JSON.stringify(validatedSettings)]
      );

      return this.mergeWithDefaults(validatedSettings);
    } catch (error) {
      console.error('Error updating system white label settings:', error);
      throw error;
    }
  }

  /**
   * Validate white label settings
   */
  validateSettings(settings) {
    const validated = {};

    // Branding validation
    if (settings.logoUrl && typeof settings.logoUrl === 'string') {
      validated.logoUrl = settings.logoUrl;
    }
    if (settings.faviconUrl && typeof settings.faviconUrl === 'string') {
      validated.faviconUrl = settings.faviconUrl;
    }
    if (settings.companyName && typeof settings.companyName === 'string') {
      validated.companyName = settings.companyName;
    }
    if (settings.primaryColor && this.isValidColor(settings.primaryColor)) {
      validated.primaryColor = settings.primaryColor;
    }
    if (settings.secondaryColor && this.isValidColor(settings.secondaryColor)) {
      validated.secondaryColor = settings.secondaryColor;
    }
    if (settings.accentColor && this.isValidColor(settings.accentColor)) {
      validated.accentColor = settings.accentColor;
    }

    // Customization validation
    if (settings.customCss && typeof settings.customCss === 'string') {
      validated.customCss = settings.customCss;
    }
    if (typeof settings.hidePoweredBy === 'boolean') {
      validated.hidePoweredBy = settings.hidePoweredBy;
    }
    if (settings.customFooterText && typeof settings.customFooterText === 'string') {
      validated.customFooterText = settings.customFooterText;
    }

    // Domain & URLs validation
    if (settings.customDomain && typeof settings.customDomain === 'string') {
      validated.customDomain = settings.customDomain;
    }
    if (settings.supportEmail && this.isValidEmail(settings.supportEmail)) {
      validated.supportEmail = settings.supportEmail;
    }
    if (settings.supportUrl && this.isValidUrl(settings.supportUrl)) {
      validated.supportUrl = settings.supportUrl;
    }

    // Features validation
    if (typeof settings.enableCustomBranding === 'boolean') {
      validated.enableCustomBranding = settings.enableCustomBranding;
    }
    if (typeof settings.enableCustomDomain === 'boolean') {
      validated.enableCustomDomain = settings.enableCustomDomain;
    }
    if (typeof settings.enableCustomSupport === 'boolean') {
      validated.enableCustomSupport = settings.enableCustomSupport;
    }

    return validated;
  }

  /**
   * Merge settings with defaults
   */
  mergeWithDefaults(settings) {
    const defaults = this.getDefaultWhiteLabelSettings();
    return { ...defaults, ...settings };
  }

  /**
   * Validate color format
   */
  isValidColor(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate URL format
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get branding configuration for a tenant
   */
  async getBrandingConfig(tenantId, userRole) {
    try {
      const settings = await this.getWhiteLabelSettings(tenantId, userRole);
      return {
        logoUrl: settings.logoUrl,
        companyName: settings.companyName,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,
      };
    } catch (error) {
      console.error('Error getting branding config:', error);
      return this.getDefaultWhiteLabelSettings();
    }
  }
}

export default new WhiteLabelService();
