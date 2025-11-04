import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({ isOpen, onClose }) => {
  const { userSettings, loadUserSettings } = useSettings();
  const { showToast } = useToast();
  
  const [step, setStep] = useState<'status' | 'generate' | 'verify' | 'success'>('status');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    verified: false,
    enabledAt: null
  });

  // Load 2FA status when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTwoFactorStatus();
    }
  }, [isOpen]);

  const loadTwoFactorStatus = async () => {
    try {
      const response = await api.get('/2fa/status');
      if (response.success) {
        setTwoFactorStatus(response.data);
        if (response.data.enabled) {
          setStep('success');
        } else {
          setStep('status');
        }
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    }
  };

  const handleGenerateSecret = async () => {
    try {
      setLoading(true);
      const response = await api.post('/2fa/generate');
      if (response.success) {
        setQrCodeUrl(response.data.qrCodeUrl);
        setSecret(response.data.manualEntryKey);
        setStep('verify');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to generate 2FA secret', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showToast('Please enter a valid 6-digit code', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/2fa/verify', { token: verificationCode });
      if (response.success) {
        setStep('success');
        await loadUserSettings(); // Refresh user settings
        showToast('2FA enabled successfully!', 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Invalid verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/2fa/disable');
      if (response.success) {
        setStep('status');
        await loadUserSettings(); // Refresh user settings
        showToast('2FA disabled successfully', 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to disable 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Shield className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500">Secure your account with 2FA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'status' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <Shield className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Enable Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account by requiring a verification code from your mobile device.
                </p>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-primary-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-primary-800">How it works</h4>
                    <div className="mt-2 text-sm text-primary-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Download an authenticator app like Google Authenticator or Authy</li>
                        <li>Scan the QR code or enter the secret key manually</li>
                        <li>Enter the 6-digit code from your app to verify</li>
                        <li>Use the code to log in to your account</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateSecret}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Enable 2FA'}
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Scan QR Code</h3>
                <p className="text-sm text-gray-500">
                  Use your authenticator app to scan this QR code
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  {qrCodeUrl && (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or enter this code manually:
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md font-mono text-sm">
                      {showSecret ? secret : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(secret)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter verification code:
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('status')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">2FA Enabled Successfully!</h3>
                <p className="text-sm text-gray-500">
                  Your account is now protected with two-factor authentication.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">What's next?</h4>
                    <div className="mt-2 text-sm text-green-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>You'll need to enter a verification code when logging in</li>
                        <li>Keep your authenticator app secure and backed up</li>
                        <li>You can disable 2FA anytime in your security settings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? 'Disabling...' : 'Disable 2FA'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetupModal;
