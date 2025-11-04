import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, Smartphone, RotateCcw, Save, Settings, ToggleLeft, ToggleRight, Globe } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const { userSettings, updateUserSettings, resetNotificationPreferences, loading } = useSettings();
  const { showToast } = useToast();
  
  const [notificationSettings, setNotificationSettings] = useState({
    // Global settings
    globalEnabled: true,
    frequency: 'immediate', // immediate, daily, weekly
    
    // Email notifications
    emailNotifications: true,
    emailCourseUpdates: true,
    emailModuleUpdates: true,
    emailQuizUpdates: true,
    emailLessonUpdates: true,
    emailAssignmentReminders: true,
    emailGrades: true,
    emailAnnouncements: true,
    emailSystemUpdates: false,
    emailSecurityAlerts: true,
    emailMarketing: false,
    
    // Push notifications
    pushNotifications: false,
    pushCourseUpdates: true,
    pushModuleUpdates: true,
    pushQuizUpdates: true,
    pushLessonUpdates: true,
    pushAssignmentReminders: true,
    pushGrades: true,
    pushAnnouncements: true,
    pushSystemUpdates: false,
    pushSecurityAlerts: true,
    
    // In-app notifications
    inAppNotifications: true,
    inAppCourseUpdates: true,
    inAppModuleUpdates: true,
    inAppQuizUpdates: true,
    inAppLessonUpdates: true,
    inAppAssignmentReminders: true,
    inAppGrades: true,
    inAppAnnouncements: true,
    inAppSystemUpdates: true,
    inAppSecurityAlerts: true,
    
    // SMS notifications
    smsNotifications: false,
    smsUrgentOnly: true,
    smsSecurityAlerts: true,
    
    // Quiet hours
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    
    // Advanced settings
    digestEmails: true,
    digestFrequency: 'weekly',
    showPreview: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  // Initialize notification settings when settings load
  useEffect(() => {
    if (userSettings?.notifications) {
      setNotificationSettings(prev => ({
        ...prev,
        ...userSettings.notifications
      }));
    }
  }, [userSettings]);

  const handleToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleInputChange = (setting: keyof typeof notificationSettings, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateUserSettings({
        notifications: notificationSettings
      });

      showToast('Notification preferences updated successfully', 'success');
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to update notification preferences', 'error');
    }
  };

  const handleReset = async () => {
    try {
      await resetNotificationPreferences();
      showToast('Notification preferences reset to defaults', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to reset notification preferences', 'error');
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
              <Bell className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
              <p className="text-sm text-gray-500">Configure how you receive notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close notification settings"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* General Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">General Notifications</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                    className="sr-only peer"
                    aria-label="Enable email notifications"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.pushNotifications}
                    onChange={() => handleToggle('pushNotifications')}
                    className="sr-only peer"
                    aria-label="Enable push notifications"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Course Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Course Notifications</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Course Updates</p>
                  <p className="text-sm text-gray-500">Get notified when courses are updated or new content is added</p>
                </div>
                <div className="flex space-x-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.emailCourseUpdates}
                      onChange={() => handleToggle('emailCourseUpdates')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">Email</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inAppCourseUpdates}
                      onChange={() => handleToggle('inAppCourseUpdates')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">In-App</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Module Updates</p>
                  <p className="text-sm text-gray-500">Get notified when modules are updated or new content is added</p>
                </div>
                <div className="flex space-x-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.emailModuleUpdates}
                      onChange={() => handleToggle('emailModuleUpdates')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">Email</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inAppModuleUpdates}
                      onChange={() => handleToggle('inAppModuleUpdates')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">In-App</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Quiz Updates</p>
                  <p className="text-sm text-gray-500">Get notified when quizzes are updated or new quizzes are published</p>
                </div>
                <div className="flex space-x-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.emailQuizUpdates}
                      onChange={() => handleToggle('emailQuizUpdates')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">Email</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inAppQuizUpdates}
                      onChange={() => handleToggle('inAppQuizUpdates')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">In-App</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Lesson Updates</p>
                  <p className="text-sm text-gray-500">Get notified when lessons are updated or new content is added</p>
                </div>
                <div className="flex space-x-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.emailLessonUpdates}
                      onChange={() => handleToggle('emailLessonUpdates')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">Email</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inAppLessonUpdates}
                      onChange={() => handleToggle('inAppLessonUpdates')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">In-App</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Assignment Reminders</p>
                  <p className="text-sm text-gray-500">Receive reminders for upcoming assignments and deadlines</p>
                </div>
                <div className="flex space-x-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.emailAssignmentReminders}
                      onChange={() => handleToggle('emailAssignmentReminders')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">Email</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inAppAssignmentReminders}
                      onChange={() => handleToggle('inAppAssignmentReminders')}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-2 text-xs text-gray-600">In-App</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* System Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">System Notifications</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">System Announcements</p>
                  <p className="text-sm text-gray-500">Receive important system updates and announcements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.systemAnnouncements}
                    onChange={() => handleToggle('systemAnnouncements')}
                    className="sr-only peer"
                    aria-label="Enable system announcements"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </button>
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

export default NotificationSettingsModal;
