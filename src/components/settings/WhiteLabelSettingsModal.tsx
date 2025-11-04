import React, { useState, useEffect } from 'react';
import { X, Upload, Palette, Globe, Settings, Save, AlertCircle } from 'lucide-react';
import { useWhiteLabel } from '../../contexts/WhiteLabelContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { post } from '../../lib/api';

interface WhiteLabelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhiteLabelSettingsModal: React.FC<WhiteLabelSettingsModalProps> = ({ isOpen, onClose }) => {
  const { whiteLabelSettings, updateWhiteLabelSettings, loading } = useWhiteLabel();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [settings, setSettings] = useState({
    // Branding
    logoUrl: '',
    faviconUrl: '',
    companyName: '',
    primaryColor: '',
    secondaryColor: '',
    accentColor: '',
    
    // Customization
    customCss: '',
    hidePoweredBy: false,
    customFooterText: '',
    
    // Domain & URLs
    customDomain: '',
    supportEmail: '',
    supportUrl: '',
    
    // Features
    enableCustomBranding: false,
    enableCustomDomain: false,
    enableCustomSupport: false,
  });

  const [uploading, setUploading] = useState(false);
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false);

  const SUNLMS_DEFAULTS = {
    primaryColor: '#B98C1B',
    secondaryColor: '#6A4F10',
    accentColor: '#D4A730',
  } as const;

  useEffect(() => {
    if (whiteLabelSettings) {
      setSettings(prev => ({ ...prev, ...whiteLabelSettings }));
    }
  }, [whiteLabelSettings]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field: 'logoUrl' | 'faviconUrl', file: File) => {
    if (!file || !user?.tenant_id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      
      let data: { success: boolean; logoUrl: string } | { success: boolean; files: Array<{ url: string }> };
      if (field === 'logoUrl') {
        // Use the tenant logo upload endpoint for logos - expects 'thumbnail' field
        formData.append('thumbnail', file);
        data = await post<{ success: boolean; logoUrl: string }>(`/media/tenant-logo/${user.tenant_id}`, formData);
      } else {
        // For favicon, use media upload endpoint - expects field name 'files'
        formData.append('files', file);
        data = await post<{ success: boolean; files: Array<{ url: string }> }>('/media/upload', formData);
      }
      
      if (data.success) {
        const url = field === 'logoUrl'
          ? ('logoUrl' in data ? data.logoUrl : undefined)
          : ('files' in data ? data.files?.[0]?.url : undefined);
        if (url) {
          handleInputChange(field, url);
          showToast('File uploaded successfully', 'success');
        } else {
          throw new Error('No URL returned from upload');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      showToast('Failed to upload file', 'error');
      console.error('Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateWhiteLabelSettings(settings);
      showToast('White label settings saved successfully', 'success');
      onClose();
    } catch {
      showToast('Failed to save white label settings', 'error');
    }
  };

  const handleRevertDefaults = async () => {
    try {
      const reverted = {
        ...settings,
        primaryColor: SUNLMS_DEFAULTS.primaryColor,
        secondaryColor: SUNLMS_DEFAULTS.secondaryColor,
        accentColor: SUNLMS_DEFAULTS.accentColor,
      };
      setSettings(reverted);
      await updateWhiteLabelSettings({
        primaryColor: SUNLMS_DEFAULTS.primaryColor,
        secondaryColor: SUNLMS_DEFAULTS.secondaryColor,
        accentColor: SUNLMS_DEFAULTS.accentColor,
      });
      showToast('Colors reverted to SunLMS defaults', 'success');
    } catch {
      showToast('Failed to revert colors', 'error');
    } finally {
      setConfirmRevertOpen(false);
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
              <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                White Label Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize branding and appearance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hoverbg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Branding Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Branding</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter company name"
                />
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    aria-label="Primary color"
                    title="Primary color"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="#B98C1B"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    aria-label="Secondary color"
                    title="Secondary color"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="#6A4F10"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => handleInputChange('accentColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    aria-label="Accent color"
                    title="Accent color"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => handleInputChange('accentColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="#D4A730"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo
              </label>
              <div className="flex items-center space-x-4">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt="Current logo"
                    className="w-20 h-10 object-contain border border-gray-300 dark:border-gray-600 rounded"
                  />
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('logoUrl', file);
                    }}
                    className="hidden"
                    id="logo-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </label>
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Favicon
              </label>
              <div className="flex items-center space-x-4">
                {settings.faviconUrl && (
                  <img
                    src={settings.faviconUrl}
                    alt="Current favicon"
                    className="w-8 h-8 object-contain border border-gray-300 dark:border-gray-600 rounded"
                  />
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('faviconUrl', file);
                    }}
                    className="hidden"
                    id="favicon-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="favicon-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Favicon'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Customization Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Customization</h3>
            </div>

            {/* Custom CSS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom CSS
              </label>
              <textarea
                value={settings.customCss}
                onChange={(e) => handleInputChange('customCss', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                placeholder="/* Custom CSS styles */"
              />
            </div>

            {/* Custom Footer Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Footer Text
              </label>
              <input
                type="text"
                value={settings.customFooterText}
                onChange={(e) => handleInputChange('customFooterText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter custom footer text"
              />
            </div>

            {/* Hide Powered By */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hidePoweredBy"
                checked={settings.hidePoweredBy}
                onChange={(e) => handleInputChange('hidePoweredBy', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="hidePoweredBy" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Hide "Powered by SunLMS" text
              </label>
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Support & Domain</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Support Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="support@yourcompany.com"
                />
              </div>

              {/* Support URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Support URL
                </label>
                <input
                  type="url"
                  value={settings.supportUrl}
                  onChange={(e) => handleInputChange('supportUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://support.yourcompany.com"
                />
              </div>

              {/* Custom Domain */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Domain
                </label>
                <input
                  type="text"
                  value={settings.customDomain}
                  onChange={(e) => handleInputChange('customDomain', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="lms.yourcompany.com"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Configure DNS to point to this application
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span>Changes will be applied immediately</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setConfirmRevertOpen(true)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Revert to Defaults
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Confirm Revert Modal */}
        {confirmRevertOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Revert to SunLMS Defaults?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                This will overwrite current brand colors with the SunLMS defaults. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setConfirmRevertOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevertDefaults}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  Confirm Revert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhiteLabelSettingsModal;
