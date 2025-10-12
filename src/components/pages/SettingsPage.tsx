import React from 'react';
import PageLayout from '../ui/PageLayout';
import { Settings, User, Bell, Shield, Palette, Globe } from 'lucide-react';

interface SettingsPageProps {
  role: 'super_admin' | 'school_admin' | 'instructor' | 'student';
}

const SettingsPage: React.FC<SettingsPageProps> = ({ role }) => {
  const breadcrumbs = [
    { label: 'Settings' }
  ];

  const settingsSections = [
    {
      icon: <User className="w-5 h-5" />,
      title: 'Profile Settings',
      description: 'Manage your personal information and preferences',
      available: true
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Notifications',
      description: 'Configure email and push notification preferences',
      available: true
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Security',
      description: 'Password, two-factor authentication, and security settings',
      available: true
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: 'Appearance',
      description: 'Customize the look and feel of your dashboard',
      available: role !== 'student'
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'School Settings',
      description: 'Configure school-wide settings and preferences',
      available: role === 'school_admin' || role === 'super_admin'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'System Settings',
      description: 'Platform-wide configuration and management',
      available: role === 'super_admin'
    }
  ];

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
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
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
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-500">Get notified about important updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch to dark theme</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;