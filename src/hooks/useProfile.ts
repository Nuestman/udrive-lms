import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';

interface UserProfileData {
  // Basic Info
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  
  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  emergency_contact_relationship?: string;
  
  // Guardian (for minors)
  guardian_name?: string;
  guardian_email?: string;
  guardian_phone?: string;
  guardian_relationship?: string;
  guardian_address?: string;
  
  // Additional
  nationality?: string;
  preferred_language?: string;
  timezone?: string;
  
  // Social
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  
  // System
  role?: string;
  tenant_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useProfile() {
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize profile data from auth context
  useEffect(() => {
    if (user) {
      setProfileData(user);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  // Update profile
  const updateProfile = async (updates: Partial<UserProfileData>) => {
    setSaving(true);
    setError(null);
    
    try {
      await updateAuthProfile(updates);
      setProfileData(prev => prev ? { ...prev, ...updates } : updates as UserProfileData);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    setSaving(true);
    setError(null);
    
    try {
      await authApi.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to change password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file); // Changed from 'file' to 'avatar' to match multer middleware

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/media/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload avatar');
      }

      const data = await response.json();
      const avatarUrl = data.avatarUrl || data.url;

      // Update auth context with new avatar URL
      await updateProfile({ avatar_url: avatarUrl });

      return { success: true, url: avatarUrl };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload avatar';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  return {
    profileData,
    loading,
    saving,
    error,
    updateProfile,
    changePassword,
    uploadAvatar,
  };
}

