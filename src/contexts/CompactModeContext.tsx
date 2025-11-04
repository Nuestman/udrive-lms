import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

interface CompactModeContextType {
  isCompactMode: boolean;
  toggleCompactMode: () => void;
  setCompactMode: (enabled: boolean) => void;
  getCompactClasses: (baseClasses: string) => string;
}

const CompactModeContext = createContext<CompactModeContextType | undefined>(undefined);

interface CompactModeProviderProps {
  children: ReactNode;
}

export const CompactModeProvider: React.FC<CompactModeProviderProps> = ({ children }) => {
  const { userSettings, updateUserSettings } = useSettings();
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Initialize compact mode from user settings
  useEffect(() => {
    if (userSettings?.appearance?.compactMode !== undefined) {
      setIsCompactMode(userSettings.appearance.compactMode);
    }
  }, [userSettings]);

  const setCompactMode = async (enabled: boolean) => {
    setIsCompactMode(enabled);
    
    // Update user settings
    try {
      await updateUserSettings({
        appearance: {
          compactMode: enabled
        }
      });
    } catch (error) {
      console.error('Failed to update compact mode preference:', error);
    }
  };

  const toggleCompactMode = () => {
    setCompactMode(!isCompactMode);
  };

  const getCompactClasses = (baseClasses: string): string => {
    if (!isCompactMode) return baseClasses;
    
    // Apply compact mode transformations
    return baseClasses
      .replace(/p-6/g, 'p-4')
      .replace(/p-4/g, 'p-3')
      .replace(/p-3/g, 'p-2')
      .replace(/py-6/g, 'py-4')
      .replace(/py-4/g, 'py-3')
      .replace(/py-3/g, 'py-2')
      .replace(/px-6/g, 'px-4')
      .replace(/px-4/g, 'px-3')
      .replace(/px-3/g, 'px-2')
      .replace(/space-y-6/g, 'space-y-4')
      .replace(/space-y-4/g, 'space-y-3')
      .replace(/space-y-3/g, 'space-y-2')
      .replace(/space-x-6/g, 'space-x-4')
      .replace(/space-x-4/g, 'space-x-3')
      .replace(/space-x-3/g, 'space-x-2')
      .replace(/text-lg/g, 'text-base')
      .replace(/text-base/g, 'text-sm')
      .replace(/text-sm/g, 'text-xs')
      .replace(/h-16/g, 'h-12')
      .replace(/h-12/g, 'h-10')
      .replace(/h-10/g, 'h-8')
      .replace(/w-16/g, 'w-12')
      .replace(/w-12/g, 'w-10')
      .replace(/w-10/g, 'w-8')
      .replace(/rounded-lg/g, 'rounded-md')
      .replace(/rounded-md/g, 'rounded-sm');
  };

  const value: CompactModeContextType = {
    isCompactMode,
    toggleCompactMode,
    setCompactMode,
    getCompactClasses,
  };

  return (
    <CompactModeContext.Provider value={value}>
      <div className={isCompactMode ? 'compact-mode' : ''}>
        {children}
      </div>
    </CompactModeContext.Provider>
  );
};

export const useCompactMode = (): CompactModeContextType => {
  const context = useContext(CompactModeContext);
  if (context === undefined) {
    throw new Error('useCompactMode must be used within a CompactModeProvider');
  }
  return context;
};
