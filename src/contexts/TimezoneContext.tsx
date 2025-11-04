import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

interface TimezoneContextType {
  currentTimezone: string;
  setTimezone: (timezone: string) => void;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  availableTimezones: { value: string; label: string; offset: string }[];
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

const availableTimezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: '+01:00' },
  { value: 'Europe/Rome', label: 'Rome (CET)', offset: '+01:00' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)', offset: '+01:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: '+09:00' },
  { value: 'Asia/Kolkata', label: 'Mumbai (IST)', offset: '+05:30' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: '+10:00' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)', offset: '+12:00' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', offset: '-03:00' },
  { value: 'America/Toronto', label: 'Toronto (EST)', offset: '-05:00' },
  { value: 'America/Vancouver', label: 'Vancouver (PST)', offset: '-08:00' },
];

interface TimezoneProviderProps {
  children: ReactNode;
}

export const TimezoneProvider: React.FC<TimezoneProviderProps> = ({ children }) => {
  const { userSettings, updateUserSettings } = useSettings();
  const [currentTimezone, setCurrentTimezone] = useState('UTC');

  // Initialize timezone from user settings
  useEffect(() => {
    if (userSettings?.appearance?.timezone) {
      setCurrentTimezone(userSettings.appearance.timezone);
    }
  }, [userSettings]);

  const setTimezone = async (timezone: string) => {
    setCurrentTimezone(timezone);
    
    // Update user settings
    try {
      await updateUserSettings({
        appearance: {
          timezone: timezone
        }
      });
    } catch (error) {
      console.error('Failed to update timezone preference:', error);
    }
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: currentTimezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  };

  const formatTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: currentTimezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...options
    };

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  };

  const value: TimezoneContextType = {
    currentTimezone,
    setTimezone,
    formatDate,
    formatTime,
    availableTimezones,
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = (): TimezoneContextType => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};
