import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { get, put } from '../lib/api';

interface WhiteLabelSettings {
  // Branding
  logoUrl?: string;
  faviconUrl?: string;
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  
  // Customization
  customCss?: string;
  hidePoweredBy?: boolean;
  customFooterText?: string;
  
  // Domain & URLs
  customDomain?: string;
  supportEmail?: string;
  supportUrl?: string;
  
  // Features
  enableCustomBranding?: boolean;
  enableCustomDomain?: boolean;
  enableCustomSupport?: boolean;
}

interface WhiteLabelContextType {
  whiteLabelSettings: WhiteLabelSettings | null;
  loading: boolean;
  error: string | null;
  updateWhiteLabelSettings: (settings: Partial<WhiteLabelSettings>) => Promise<void>;
  applyCustomStyles: () => void;
  getBrandingConfig: () => {
    logoUrl: string;
    companyName: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

interface WhiteLabelProviderProps {
  children: ReactNode;
}

export const WhiteLabelProvider: React.FC<WhiteLabelProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [whiteLabelSettings, setWhiteLabelSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load white label settings
  const loadWhiteLabelSettings = async () => {
    const role = user?.role;
    if (!user || !['super_admin', 'school_admin'].includes(role || '')) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading white label settings for user:', user.email, 'role:', role);
      const data = await get<{ success: boolean; settings: WhiteLabelSettings }>('/settings/white-label');
      console.log('✅ White label settings loaded:', data);
      setWhiteLabelSettings(data.settings || {});
    } catch (err: any) {
      setError(err.message || 'Failed to load white label settings');
      console.error('❌ Error loading white label settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update white label settings
  const updateWhiteLabelSettings = async (settings: Partial<WhiteLabelSettings>) => {
    const role = user?.role;
    if (!user || !['super_admin', 'school_admin'].includes(role || '')) {
      throw new Error('Insufficient permissions');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Updating white label settings:', settings);
      const data = await put<{ success: boolean; settings: WhiteLabelSettings }>('/settings/white-label', settings);
      console.log('✅ White label settings updated:', data);
      setWhiteLabelSettings(data.settings);
      applyCustomStyles();
    } catch (err: any) {
      setError(err.message || 'Failed to update white label settings');
      console.error('❌ Error updating white label settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Apply custom styles to the document
  const applyCustomStyles = () => {
    if (!whiteLabelSettings) return;

    const root = document.documentElement;
    
    // Apply or clear custom colors
    if (whiteLabelSettings.primaryColor !== undefined) {
      if (whiteLabelSettings.primaryColor) {
        root.style.setProperty('--color-primary', whiteLabelSettings.primaryColor);
        root.style.setProperty('--brand-primary', whiteLabelSettings.primaryColor);
      } else {
        root.style.removeProperty('--color-primary');
        root.style.removeProperty('--brand-primary');
      }
    }
    if (whiteLabelSettings.secondaryColor !== undefined) {
      if (whiteLabelSettings.secondaryColor) {
        root.style.setProperty('--color-secondary', whiteLabelSettings.secondaryColor);
        root.style.setProperty('--brand-secondary', whiteLabelSettings.secondaryColor);
      } else {
        root.style.removeProperty('--color-secondary');
        root.style.removeProperty('--brand-secondary');
      }
    }
    if (whiteLabelSettings.accentColor !== undefined) {
      if (whiteLabelSettings.accentColor) {
        root.style.setProperty('--color-accent', whiteLabelSettings.accentColor);
        root.style.setProperty('--brand-accent', whiteLabelSettings.accentColor);
      } else {
        root.style.removeProperty('--color-accent');
        root.style.removeProperty('--brand-accent');
      }
    }

    // Apply custom CSS
    if (whiteLabelSettings.customCss) {
      let customStyleElement = document.getElementById('white-label-custom-css');
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'white-label-custom-css';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = whiteLabelSettings.customCss;
    }

    // Update favicon
    if (whiteLabelSettings.faviconUrl) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = whiteLabelSettings.faviconUrl;
      }
    }
  };

  // Get branding configuration
  const getBrandingConfig = () => {
    const defaultConfig = {
      logoUrl: '/sunlms-logo-wide.png',
      companyName: 'SunLMS',
      primaryColor: '#B98C1B',
      secondaryColor: '#6a4f10',
      accentColor: '#d4a730',
    };

    if (!whiteLabelSettings) return defaultConfig;

    return {
      logoUrl: whiteLabelSettings.logoUrl || defaultConfig.logoUrl,
      companyName: whiteLabelSettings.companyName || defaultConfig.companyName,
      primaryColor: whiteLabelSettings.primaryColor || defaultConfig.primaryColor,
      secondaryColor: whiteLabelSettings.secondaryColor || defaultConfig.secondaryColor,
      accentColor: whiteLabelSettings.accentColor || defaultConfig.accentColor,
    };
  };

  // Load settings when user changes
  useEffect(() => {
    const role = user?.role;
    if (user && ['super_admin', 'school_admin'].includes(role || '')) {
      loadWhiteLabelSettings();
    } else {
      setWhiteLabelSettings(null);
      setError(null);
    }
  }, [user]);

  // Apply styles when settings change
  useEffect(() => {
    if (whiteLabelSettings) {
      applyCustomStyles();
    }
  }, [whiteLabelSettings]);

  const value: WhiteLabelContextType = {
    whiteLabelSettings,
    loading,
    error,
    updateWhiteLabelSettings,
    applyCustomStyles,
    getBrandingConfig,
  };

  return (
    <WhiteLabelContext.Provider value={value}>
      {children}
    </WhiteLabelContext.Provider>
  );
};

export const useWhiteLabel = () => {
  const context = useContext(WhiteLabelContext);
  if (context === undefined) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
};
