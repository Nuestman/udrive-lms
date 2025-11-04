import React, { useState, useEffect } from 'react';
import { X, Palette, Sun, Moon, Monitor, Globe, Save } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';

interface AppearanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppearanceSettingsModal: React.FC<AppearanceSettingsModalProps> = ({ isOpen, onClose }) => {
  const { userSettings, updateUserSettings, loading } = useSettings();
  const { showToast } = useToast();
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'auto',
    language: 'en',
    timezone: 'UTC',
    compactMode: false
  });

  // Initialize appearance settings when settings load
  useEffect(() => {
    if (userSettings?.appearance) {
      setAppearanceSettings({
        theme: userSettings.appearance.theme || 'light',
        language: userSettings.appearance.language || 'en',
        timezone: userSettings.appearance.timezone || 'UTC',
        compactMode: userSettings.appearance.compactMode || false
      });
    }
  }, [userSettings]);

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setAppearanceSettings(prev => ({ ...prev, theme }));
  };

  const handleLanguageChange = (language: string) => {
    setAppearanceSettings(prev => ({ ...prev, language }));
  };

  const handleTimezoneChange = (timezone: string) => {
    setAppearanceSettings(prev => ({ ...prev, timezone }));
  };

  const handleCompactModeToggle = () => {
    setAppearanceSettings(prev => ({ ...prev, compactMode: !prev.compactMode }));
  };

  const handleSave = async () => {
    try {
      await updateUserSettings({
        appearance: appearanceSettings
      });

      showToast('Appearance settings updated successfully', 'success');
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to update appearance settings', 'error');
    }
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'auto':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto (System)';
      default:
        return 'Light';
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Palette className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Appearance Settings</h2>
              <p className="text-sm text-gray-500">Customize the look and feel of your dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Theme</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['light', 'dark', 'auto'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme as 'light' | 'dark' | 'auto')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    appearanceSettings.theme === theme
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      appearanceSettings.theme === theme ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      {getThemeIcon(theme)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getThemeLabel(theme)}</p>
                      <p className="text-sm text-gray-500">
                        {theme === 'auto' ? 'Follows system preference' : `${theme} theme`}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Language and Region */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Language and Region</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={appearanceSettings.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                  <option value="ru">Русский</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={appearanceSettings.timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Berlin">Berlin (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Shanghai (CST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interface Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Interface Options</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Compact Mode</p>
                  <p className="text-sm text-gray-500">Reduce spacing and padding for a more compact interface</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={appearanceSettings.compactMode}
                    onChange={handleCompactModeToggle}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Preview</h3>
            
            <div className={`p-4 border rounded-lg ${
              appearanceSettings.theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            } ${appearanceSettings.compactMode ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full ${
                  appearanceSettings.theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                }`}></div>
                <div>
                  <p className={`font-medium ${appearanceSettings.compactMode ? 'text-sm' : 'text-base'}`}>
                    Sample User
                  </p>
                  <p className={`text-sm ${
                    appearanceSettings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    This is how your interface will look
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettingsModal;
