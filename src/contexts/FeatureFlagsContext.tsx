import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

interface FeatureFlags {
  // Core Features
  multiTenant: boolean;
  analytics: boolean;
  certificates: boolean;
  progressTracking: boolean;
  quizEngine: boolean;
  
  // Advanced Features
  whiteLabeling: boolean;
  realTimeNotifications: boolean;
  fileUploads: boolean;
  twoFactorAuth: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  
  // UI Features
  darkMode: boolean;
  compactMode: boolean;
  languageSelection: boolean;
  timezoneSelection: boolean;
  
  // System Features
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  passwordReset: boolean;
  userManagement: boolean;
  courseManagement: boolean;
  enrollmentManagement: boolean;
}

interface FeatureFlagsContextType {
  features: FeatureFlags;
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  updateFeature: (feature: keyof FeatureFlags, enabled: boolean) => void;
  loading: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

const defaultFeatures: FeatureFlags = {
  // Core Features
  multiTenant: true,
  analytics: true,
  certificates: true,
  progressTracking: true,
  quizEngine: true,
  
  // Advanced Features
  whiteLabeling: true,
  realTimeNotifications: true,
  fileUploads: true,
  twoFactorAuth: true,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  
  // UI Features
  darkMode: true,
  compactMode: true,
  languageSelection: true,
  timezoneSelection: true,
  
  // System Features
  maintenanceMode: false,
  registrationEnabled: true,
  passwordReset: true,
  userManagement: true,
  courseManagement: true,
  enrollmentManagement: true,
};

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const { systemSettings, updateSystemSettings, loading } = useSettings();
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);

  // Initialize features from system settings
  useEffect(() => {
    if (systemSettings?.features) {
      setFeatures(prev => ({
        ...prev,
        ...systemSettings.features
      }));
    }
  }, [systemSettings]);

  const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
    return features[feature] || false;
  };

  const updateFeature = async (feature: keyof FeatureFlags, enabled: boolean) => {
    const updatedFeatures = {
      ...features,
      [feature]: enabled
    };
    
    setFeatures(updatedFeatures);
    
    // Update system settings
    try {
      await updateSystemSettings({
        features: updatedFeatures
      });
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      // Revert on error
      setFeatures(features);
    }
  };

  const value: FeatureFlagsContextType = {
    features,
    isFeatureEnabled,
    updateFeature,
    loading,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};
