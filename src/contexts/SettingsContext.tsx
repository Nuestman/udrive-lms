import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { api } from '../lib/api';

interface UserSettings {
  profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    preferredLanguage?: string;
    timezone?: string;
  };
  notifications: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    courseUpdates?: boolean;
    assignmentReminders?: boolean;
    systemAnnouncements?: boolean;
  };
  appearance: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
    compactMode?: boolean;
  };
  security: {
    twoFactorEnabled?: boolean;
    lastPasswordChange?: string;
    loginNotifications?: boolean;
  };
}

interface TenantSettings {
  basic: {
    name?: string;
    subdomain?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    logoUrl?: string;
  };
  preferences: {
    defaultLanguage?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    currency?: string;
  };
  notifications: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    maintenanceNotifications?: boolean;
    securityAlerts?: boolean;
  };
  features: {
    allowStudentRegistration?: boolean;
    requireEmailVerification?: boolean;
    enableProgressTracking?: boolean;
    enableCertificates?: boolean;
    enableQuizzes?: boolean;
  };
  subscription: {
    tier?: string;
    status?: string;
  };
}

interface SystemSettings {
  platform: {
    name?: string;
    version?: string;
    maintenanceMode?: boolean;
    registrationEnabled?: boolean;
  };
  security: {
    passwordMinLength?: number;
    requireStrongPasswords?: boolean;
    sessionTimeout?: number;
    maxLoginAttempts?: number;
    lockoutDuration?: number;
  };
  notifications: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    pushEnabled?: boolean;
  };
  features: {
    multiTenant?: boolean;
    analytics?: boolean;
    certificates?: boolean;
    progressTracking?: boolean;
    quizEngine?: boolean;
  };
}

interface SettingsContextType {
  // State
  userSettings: UserSettings | null;
  tenantSettings: TenantSettings | null;
  systemSettings: SystemSettings | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadUserSettings: () => Promise<void>;
  loadTenantSettings: () => Promise<void>;
  loadSystemSettings: () => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateTenantSettings: (settings: Partial<TenantSettings>) => Promise<void>;
  updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetNotificationPreferences: () => Promise<void>;
  clearError: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const { setTheme, forceThemeUpdate } = useTheme();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user settings
  const loadUserSettings = useCallback(async () => {
    if (!user || loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load both user settings and 2FA status
      const [settingsResponse, twoFactorResponse] = await Promise.all([
        api.get('/settings/user'),
        api.get('/2fa/status').catch(() => ({ success: false, data: { enabled: false } }))
      ]);
      
      if (settingsResponse.success) {
        const userSettingsData = settingsResponse.data;
        
        // Merge 2FA status into user settings
        if (twoFactorResponse.success) {
          userSettingsData.security = {
            ...userSettingsData.security,
            twoFactorEnabled: twoFactorResponse.data.enabled
          };
        }
        
        setUserSettings(userSettingsData);
      } else {
        throw new Error(settingsResponse.error || 'Failed to load user settings');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user settings';
      setError(errorMessage);
      console.error('Error loading user settings:', err);
      // Don't throw the error to prevent app crashes
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  // Load tenant settings
  const loadTenantSettings = useCallback(async () => {
    if (!user || !['super_admin', 'school_admin'].includes(profile?.role || '')) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/settings/tenant');
      if (response.success) {
        setTenantSettings(response.data);
      } else {
        throw new Error(response.error || 'Failed to load tenant settings');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tenant settings';
      setError(errorMessage);
      console.error('Error loading tenant settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  // Load system settings
  const loadSystemSettings = useCallback(async () => {
    if (!user || profile?.role !== 'super_admin') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/settings/system');
      if (response.success) {
        setSystemSettings(response.data);
      } else {
        throw new Error(response.error || 'Failed to load system settings');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load system settings';
      setError(errorMessage);
      console.error('Error loading system settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  // Update user settings
  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/settings/user', settings);
      if (response.success) {
        setUserSettings(response.data);
        
        // Update theme if appearance settings changed
        if (settings.appearance?.theme) {
          forceThemeUpdate(settings.appearance.theme);
        }
      } else {
        throw new Error(response.error || 'Failed to update user settings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update user settings');
      console.error('Error updating user settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update tenant settings
  const updateTenantSettings = async (settings: Partial<TenantSettings>) => {
    if (!user || !['super_admin', 'school_admin'].includes(profile?.role || '')) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/settings/tenant', settings);
      if (response.success) {
        setTenantSettings(response.data);
      } else {
        throw new Error(response.error || 'Failed to update tenant settings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update tenant settings');
      console.error('Error updating tenant settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update system settings
  const updateSystemSettings = async (settings: Partial<SystemSettings>) => {
    if (!user || profile?.role !== 'super_admin') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/settings/system', settings);
      if (response.success) {
        setSystemSettings(response.data);
      } else {
        throw new Error(response.error || 'Failed to update system settings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update system settings');
      console.error('Error updating system settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/settings/change-password', {
        currentPassword,
        newPassword
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      console.error('Error changing password:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset notification preferences
  const resetNotificationPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/settings/reset-notifications');
      if (response.success) {
        // Reload user settings to get updated preferences
        await loadUserSettings();
      } else {
        throw new Error(response.error || 'Failed to reset notification preferences');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset notification preferences');
      console.error('Error resetting notification preferences:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Clear settings when user changes (but don't auto-load)
  useEffect(() => {
    if (!user) {
      setUserSettings(null);
      setTenantSettings(null);
      setSystemSettings(null);
      setError(null);
    }
  }, [user]);

  // Sync theme from user settings when they load
  useEffect(() => {
    if (userSettings?.appearance?.theme) {
      forceThemeUpdate(userSettings.appearance.theme);
    }
  }, [userSettings?.appearance?.theme, forceThemeUpdate]);

  const value: SettingsContextType = {
    userSettings,
    tenantSettings,
    systemSettings,
    loading,
    error,
    loadUserSettings,
    loadTenantSettings,
    loadSystemSettings,
    updateUserSettings,
    updateTenantSettings,
    updateSystemSettings,
    changePassword,
    resetNotificationPreferences,
    clearError,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
