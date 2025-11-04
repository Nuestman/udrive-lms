import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '../ui/PageLayout';
import { Settings, User, Bell, Shield, Palette, Globe } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import ProfileSettingsModal from '../settings/ProfileSettingsModal';
import NotificationSettingsModal from '../settings/NotificationSettingsModal';
import SecuritySettingsModal from '../settings/SecuritySettingsModal';
import AppearanceSettingsModal from '../settings/AppearanceSettingsModal';
import SchoolSettingsModal from '../settings/SchoolSettingsModal';
import SystemSettingsModal from '../settings/SystemSettingsModal';
import WhiteLabelSettingsModal from '../settings/WhiteLabelSettingsModal';

interface SettingsPageProps {
  role: 'super_admin' | 'school_admin' | 'instructor' | 'student';
}

const SettingsPage: React.FC<SettingsPageProps> = ({ role }) => {
  const { userSettings, updateUserSettings, loading, loadUserSettings, loadTenantSettings, loadSystemSettings } = useSettings();
  const { showToast } = useToast();
  
  const breadcrumbs = [
    { label: 'Settings' }
  ];

  // Modal states
  const [openModal, setOpenModal] = useState<string | null>(null);
  
  // Quick settings state
  const [quickSettings, setQuickSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false
  });
  const isLoadingRef = useRef(false);

  // Load settings when component mounts (only once)
  useEffect(() => {
    const loadSettings = async () => {
      if (isLoadingRef.current) return; // Prevent multiple simultaneous loads
      
      try {
        isLoadingRef.current = true;
        
        // Only load if not already loaded
        if (!userSettings) {
          await loadUserSettings();
        }
        
        if (['super_admin', 'school_admin'].includes(role)) {
          await loadTenantSettings();
        }
        
        if (role === 'super_admin') {
          await loadSystemSettings();
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadSettings();
  }, [role]); // Only depend on role to prevent infinite loop

  // Initialize quick settings from user settings
  useEffect(() => {
    if (userSettings?.notifications && userSettings?.appearance) {
      setQuickSettings({
        emailNotifications: userSettings.notifications.emailNotifications ?? true,
        pushNotifications: userSettings.notifications.pushNotifications ?? false,
        darkMode: userSettings.appearance.theme === 'dark'
      });
    }
  }, [userSettings]);

  const settingsSections = [
    {
      icon: <User className="w-5 h-5" />,
      title: 'Profile Settings',
      description: 'Manage your personal information and preferences',
      available: true,
      modal: 'profile'
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Notifications',
      description: 'Configure email and push notification preferences',
      available: true,
      modal: 'notifications'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Security',
      description: 'Password, two-factor authentication, and security settings',
      available: true,
      modal: 'security'
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: 'Appearance',
      description: 'Customize the look and feel of your dashboard',
      available: role !== 'student',
      modal: 'appearance'
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'School Settings',
      description: 'Configure school-wide settings and preferences',
      available: role === 'school_admin' || role === 'super_admin',
      modal: 'school'
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: 'White Label Settings',
      description: 'Customize branding, colors, and appearance',
      available: role === 'school_admin' || role === 'super_admin',
      modal: 'whiteLabel'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'System Settings',
      description: 'Platform-wide configuration and management',
      available: role === 'super_admin',
      modal: 'system'
    }
  ];

  const handleSectionClick = (modal: string) => {
    setOpenModal(modal);
  };

  const handleQuickSettingToggle = async (setting: keyof typeof quickSettings) => {
    try {
      const newValue = !quickSettings[setting];
      setQuickSettings(prev => ({ ...prev, [setting]: newValue }));

      // Update the setting in the backend
      if (setting === 'darkMode') {
        await updateUserSettings({
          appearance: {
            theme: newValue ? 'dark' : 'light'
          }
        });
      } else if (setting === 'emailNotifications' || setting === 'pushNotifications') {
        await updateUserSettings({
          notifications: {
            [setting]: newValue
          }
        });
      }

      showToast('Setting updated successfully', 'success');
    } catch (error: unknown) {
      // Revert the toggle if the update failed
      setQuickSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
      const errorMessage = error instanceof Error ? error.message : 'Failed to update setting';
      showToast(errorMessage, 'error');
    }
  };

  return (
    <PageLayout
      title="Settings"
      description="Manage your account and system preferences"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsSections
            .filter(section => section.available)
            .map((section, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSectionClick(section.modal)}
              >
                <div className="flex items-start">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <div className="text-primary-600">
                      {section.icon}
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Quick Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email updates about your courses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={quickSettings.emailNotifications}
                  onChange={() => handleQuickSettingToggle('emailNotifications')}
                  disabled={loading}
                  aria-label="Toggle email notifications"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-500">Get notified about important updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={quickSettings.pushNotifications}
                  onChange={() => handleQuickSettingToggle('pushNotifications')}
                  disabled={loading}
                  aria-label="Toggle push notifications"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch to dark theme</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={quickSettings.darkMode}
                  onChange={() => handleQuickSettingToggle('darkMode')}
                  disabled={loading}
                  aria-label="Toggle dark mode"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Modals */}
        <ProfileSettingsModal 
          isOpen={openModal === 'profile'} 
          onClose={() => setOpenModal(null)} 
        />
        <NotificationSettingsModal 
          isOpen={openModal === 'notifications'} 
          onClose={() => setOpenModal(null)} 
        />
        <SecuritySettingsModal 
          isOpen={openModal === 'security'} 
          onClose={() => setOpenModal(null)} 
        />
        <AppearanceSettingsModal 
          isOpen={openModal === 'appearance'} 
          onClose={() => setOpenModal(null)} 
        />
        <SchoolSettingsModal 
          isOpen={openModal === 'school'} 
          onClose={() => setOpenModal(null)} 
        />
        <WhiteLabelSettingsModal 
          isOpen={openModal === 'whiteLabel'} 
          onClose={() => setOpenModal(null)} 
        />
        <SystemSettingsModal 
          isOpen={openModal === 'system'} 
          onClose={() => setOpenModal(null)} 
        />
      </div>
    </PageLayout>
  );
};

export default SettingsPage;