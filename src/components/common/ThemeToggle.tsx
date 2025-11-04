import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, setTheme, resolvedTheme, forceThemeUpdate } = useTheme();
  const { updateUserSettings } = useSettings();

  const getIcon = () => {
    if (theme === 'auto') {
      return <Monitor className="w-4 h-4" />;
    }
    return resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />;
  };

  const getNextTheme = () => {
    switch (theme) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'auto';
      case 'auto':
        return 'light';
      default:
        return 'light';
    }
  };

  const handleToggle = async () => {
    const newTheme = getNextTheme();
    forceThemeUpdate(newTheme);
    
    // Save to user settings
    try {
      await updateUserSettings({
        appearance: {
          theme: newTheme
        }
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto';
      default:
        return 'Light';
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${className}`}
      title={`Current theme: ${getLabel()}. Click to cycle through themes.`}
    >
      {getIcon()}
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {getLabel()}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
