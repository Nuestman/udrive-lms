import React, { useState, useEffect } from 'react';
import { X, Save, Bell, Mail, Smartphone, Globe, Settings, Clock, Volume2, Vibrate } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';

interface AdvancedNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdvancedNotificationSettingsModal: React.FC<AdvancedNotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const { userSettings, updateUserSettings } = useSettings();
  const { showToast } = useToast();
  
  const [notificationSettings, setNotificationSettings] = useState({
    // Global settings
    globalEnabled: true,
    frequency: 'immediate', // immediate, daily, weekly
    
    // Email notifications
    emailNotifications: true,
    emailCourseUpdates: true,
    emailAssignmentReminders: true,
    emailGrades: true,
    emailAnnouncements: true,
    emailSystemUpdates: false,
    emailSecurityAlerts: true,
    emailMarketing: false,
    
    // Push notifications
    pushNotifications: false,
    pushCourseUpdates: true,
    pushAssignmentReminders: true,
    pushGrades: true,
    pushAnnouncements: true,
    pushSystemUpdates: false,
    pushSecurityAlerts: true,
    
    // In-app notifications
    inAppNotifications: true,
    inAppCourseUpdates: true,
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Advanced Notification Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure detailed notification preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Global Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Global Settings
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Enable All Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Master switch for all notification types</p>
                </div>
                <button
                  onClick={() => handleToggle('globalEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.globalEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.globalEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notification Frequency
                </label>
                <select
                  value={notificationSettings.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Email Notifications
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.emailNotifications ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notificationSettings.emailNotifications && (
                <div className="ml-6 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Course Updates</span>
                      <button
                        onClick={() => handleToggle('emailCourseUpdates')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.emailCourseUpdates ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.emailCourseUpdates ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Assignment Reminders</span>
                      <button
                        onClick={() => handleToggle('emailAssignmentReminders')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.emailAssignmentReminders ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.emailAssignmentReminders ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Grades</span>
                      <button
                        onClick={() => handleToggle('emailGrades')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.emailGrades ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.emailGrades ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Security Alerts</span>
                      <button
                        onClick={() => handleToggle('emailSecurityAlerts')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.emailSecurityAlerts ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.emailSecurityAlerts ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">System Updates</span>
                      <button
                        onClick={() => handleToggle('emailSystemUpdates')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.emailSystemUpdates ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.emailSystemUpdates ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Marketing Emails</span>
                      <button
                        onClick={() => handleToggle('emailMarketing')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.emailMarketing ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.emailMarketing ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Push Notifications
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your device</p>
                </div>
                <button
                  onClick={() => handleToggle('pushNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.pushNotifications ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notificationSettings.pushNotifications && (
                <div className="ml-6 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Course Updates</span>
                      <button
                        onClick={() => handleToggle('pushCourseUpdates')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.pushCourseUpdates ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.pushCourseUpdates ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Assignment Reminders</span>
                      <button
                        onClick={() => handleToggle('pushAssignmentReminders')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.pushAssignmentReminders ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.pushAssignmentReminders ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Grades</span>
                      <button
                        onClick={() => handleToggle('pushGrades')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.pushGrades ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.pushGrades ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Security Alerts</span>
                      <button
                        onClick={() => handleToggle('pushSecurityAlerts')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notificationSettings.pushSecurityAlerts ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.pushSecurityAlerts ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Quiet Hours
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Enable Quiet Hours</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pause notifications during specified hours</p>
                </div>
                <button
                  onClick={() => handleToggle('quietHoursEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.quietHoursEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notificationSettings.quietHoursEnabled && (
                <div className="ml-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={notificationSettings.quietHoursStart}
                      onChange={(e) => handleInputChange('quietHoursStart', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={notificationSettings.quietHoursEnd}
                      onChange={(e) => handleInputChange('quietHoursEnd', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Advanced Settings
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Sound Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Play sound for notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('soundEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.soundEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Vibrate className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Vibration</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vibrate device for notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('vibrationEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.vibrationEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Show Preview</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Show notification content preview</p>
                </div>
                <button
                  onClick={() => handleToggle('showPreview')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.showPreview ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.showPreview ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedNotificationSettingsModal;
