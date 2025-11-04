import React, { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Globe, 
  Shield, Save, X, Edit3, Lock, 
  Camera, Heart, UserPlus, Linkedin, Twitter,
  ExternalLink
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import ChangePasswordModal from './ChangePasswordModal';
import { useToast } from '../../contexts/ToastContext';

const UserProfilePage: React.FC = () => {
  const { profileData, loading, saving, updateProfile, uploadAvatar } = useProfile();
  const { success, error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState(profileData || {});

  type ProfileForm = {
    date_of_birth?: string;
    [key: string]: unknown;
  };

  const normalizeProfileForForm = React.useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return {} as ProfileForm;
    const obj = data as ProfileForm;
    const dob = obj.date_of_birth;
    let normalizedDob = dob;
    if (dob) {
      // Ensure HTML date input compatible format (YYYY-MM-DD)
      if (typeof dob === 'string') {
        normalizedDob = dob.length >= 10 ? dob.substring(0, 10) : dob;
      }
    }
    return { ...(obj as Record<string, unknown>), date_of_birth: normalizedDob } as ProfileForm;
  }, []);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Update form data when profile data changes
  React.useEffect(() => {
    if (profileData) {
      setFormData(normalizeProfileForForm(profileData));
    }
  }, [profileData, normalizeProfileForForm]);

  const handleInputChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const result = await updateProfile(formData);
    if (result.success) {
      setIsEditing(false);
      success('Profile updated successfully!');
    } else {
      showError(result.error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData(profileData || {});
    setIsEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size should be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    const result = await uploadAvatar(file);
    setUploadingAvatar(false);

    if (result.success) {
      success('Avatar updated successfully!');
    } else {
      showError(result.error || 'Failed to upload avatar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role?: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      super_admin: { color: 'bg-purple-100 text-purple-800', label: 'Super Admin' },
      school_admin: { color: 'bg-primary-100 text-primary-800', label: 'School Admin' },
      instructor: { color: 'bg-green-100 text-green-800', label: 'Instructor' },
      student: { color: 'bg-yellow-100 text-yellow-800', label: 'Student' },
    };
    
    const badge = role ? badges[role] : null;
    if (!badge) return null;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Shield className="w-4 h-4 mr-1" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your personal information and preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </button>
                <button
                  onClick={() => { setFormData(normalizeProfileForForm(profileData || {})); setIsEditing(true); }}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar and Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <label 
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full cursor-pointer hover:bg-primary-700 transition-colors"
                    title="Upload avatar"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploadingAvatar}
                      aria-label="Upload avatar image"
                    />
                  </label>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                {formData.first_name} {formData.last_name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{formData.email}</p>
              <div className="mt-3">
                {getRoleBadge(formData.role)}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">
                    Joined {formData.created_at ? new Date(formData.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {formData.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{formData.phone}</span>
                  </div>
                )}
                {(formData.city || formData.country) && (
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {[formData.city, formData.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    id="first_name"
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.first_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    id="last_name"
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.last_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {formData.email}
                </p>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.phone || 'Not set'}</p>
                )}
              </div>
              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">
                    {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality
                </label>
                {isEditing ? (
                  <input
                    id="nationality"
                    type="text"
                    value={formData.nationality || ''}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.nationality || 'Not set'}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900">{formData.bio || 'No bio added yet'}</p>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary-600" />
              Address Information
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                {isEditing ? (
                  <input
                    id="address_line1"
                    type="text"
                    value={formData.address_line1 || ''}
                    onChange={(e) => handleInputChange('address_line1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.address_line1 || 'Not set'}</p>
                )}
              </div>
              <div>
                <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                {isEditing ? (
                  <input
                    id="address_line2"
                    type="text"
                    value={formData.address_line2 || ''}
                    onChange={(e) => handleInputChange('address_line2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.address_line2 || 'Not set'}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      id="city"
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.city || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="state_province" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  {isEditing ? (
                    <input
                      id="state_province"
                      type="text"
                      value={formData.state_province || ''}
                      onChange={(e) => handleInputChange('state_province', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.state_province || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  {isEditing ? (
                    <input
                      id="postal_code"
                      type="text"
                      value={formData.postal_code || ''}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.postal_code || 'Not set'}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                {isEditing ? (
                  <input
                    id="country"
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.country || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-primary-600" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                {isEditing ? (
                  <input
                    id="emergency_contact_name"
                    type="text"
                    value={formData.emergency_contact_name || ''}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.emergency_contact_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                {isEditing ? (
                  <input
                    id="emergency_contact_relationship"
                    type="text"
                    value={formData.emergency_contact_relationship || ''}
                    onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.emergency_contact_relationship || 'Not set'}</p>
                )}
              </div>
              <div>
                <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone || ''}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.emergency_contact_phone || 'Not set'}</p>
                )}
              </div>
              <div>
                <label htmlFor="emergency_contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    id="emergency_contact_email"
                    type="email"
                    value={formData.emergency_contact_email || ''}
                    onChange={(e) => handleInputChange('emergency_contact_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.emergency_contact_email || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Guardian Information (for students) */}
          {formData.role === 'student' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-primary-600" />
                Guardian Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guardian_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Guardian Name
                  </label>
                  {isEditing ? (
                    <input
                      id="guardian_name"
                      type="text"
                      value={formData.guardian_name || ''}
                      onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.guardian_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="guardian_relationship" className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  {isEditing ? (
                    <input
                      id="guardian_relationship"
                      type="text"
                      value={formData.guardian_relationship || ''}
                      onChange={(e) => handleInputChange('guardian_relationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.guardian_relationship || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="guardian_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      id="guardian_phone"
                      type="tel"
                      value={formData.guardian_phone || ''}
                      onChange={(e) => handleInputChange('guardian_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.guardian_phone || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="guardian_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      id="guardian_email"
                      type="email"
                      value={formData.guardian_email || ''}
                      onChange={(e) => handleInputChange('guardian_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.guardian_email || 'Not set'}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="guardian_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  {isEditing ? (
                    <textarea
                      id="guardian_address"
                      value={formData.guardian_address || ''}
                      onChange={(e) => handleInputChange('guardian_address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.guardian_address || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preferences and Social Links */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-primary-600" />
              Preferences & Social Links
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Language
                  </label>
                  {isEditing ? (
                    <select
                      id="preferred_language"
                      value={formData.preferred_language || 'en'}
                      onChange={(e) => handleInputChange('preferred_language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{formData.preferred_language || 'English'}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  {isEditing ? (
                    <input
                      id="timezone"
                      type="text"
                      value={formData.timezone || 'UTC'}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="UTC"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.timezone || 'UTC'}</p>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Social Links</h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Linkedin className="w-4 h-4 mr-2 text-primary-600" />
                      LinkedIn
                    </label>
                    {isEditing ? (
                      <input
                        id="linkedin_url"
                        type="url"
                        value={formData.linkedin_url || ''}
                        onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://linkedin.com/in/username"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {formData.linkedin_url ? (
                          <a 
                            href={formData.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 flex items-center"
                          >
                            {formData.linkedin_url}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        ) : (
                          'Not set'
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="twitter_url" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Twitter className="w-4 h-4 mr-2 text-primary-400" />
                      Twitter
                    </label>
                    {isEditing ? (
                      <input
                        id="twitter_url"
                        type="url"
                        value={formData.twitter_url || ''}
                        onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://twitter.com/username"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {formData.twitter_url ? (
                          <a 
                            href={formData.twitter_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 flex items-center"
                          >
                            {formData.twitter_url}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        ) : (
                          'Not set'
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-gray-600" />
                      Website
                    </label>
                    {isEditing ? (
                      <input
                        id="website_url"
                        type="url"
                        value={formData.website_url || ''}
                        onChange={(e) => handleInputChange('website_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {formData.website_url ? (
                          <a 
                            href={formData.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 flex items-center"
                          >
                            {formData.website_url}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        ) : (
                          'Not set'
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};

export default UserProfilePage;

