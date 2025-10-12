// Updated AuthContext for Local PostgreSQL Database
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../lib/api';

// Enhanced logging utility
const logAuthEvent = (event: string, data?: any, isError = false) => {
  const timestamp = new Date().toISOString();
  const logLevel = isError ? 'ERROR' : 'INFO';
  console.log(`[${timestamp}] [AUTH-${logLevel}] ${event}`, data || '');
  
  if (isError && data) {
    console.error('Auth Error Details:', data);
  }
};

interface UserProfile {
  id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'super_admin' | 'school_admin' | 'instructor' | 'student';
  department?: string;
  position?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (credential: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize: Check if user is already logged in
  useEffect(() => {
    const initAuth = async () => {
      try {
        logAuthEvent('Checking for existing session');
        const response = await authApi.getCurrentUser();
        
        if (response.success && response.user) {
          logAuthEvent('Session found', { userId: response.user.id, role: response.user.role });
          setUser(response.user);
          setProfile(response.user);
        } else {
          logAuthEvent('No active session');
        }
      } catch (error: any) {
        logAuthEvent('No active session or session expired', { error: error.message });
        // Not an error - user just isn't logged in
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (credential: string, password: string) => {
    logAuthEvent('Sign in attempt', { credential: credential.substring(0, 3) + '***' });
    
    try {
      // Our API only supports email login
      const response = await authApi.login(credential, password);
      
      if (response.success && response.user) {
        logAuthEvent('Sign in successful', { userId: response.user.id, role: response.user.role });
        setUser(response.user);
        setProfile(response.user);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      logAuthEvent('Sign in failed', { 
        error: error.message, 
        credential: credential.substring(0, 3) + '***' 
      }, true);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    logAuthEvent('Sign up attempt', { email: email.substring(0, 3) + '***' });
    
    try {
      const response = await authApi.signup({
        email,
        password,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone,
        tenant_id: userData.tenant_id || '',
        role: userData.role,
      });
      
      if (response.success && response.user) {
        logAuthEvent('Sign up successful', { userId: response.user.id });
        setUser(response.user);
        setProfile(response.user);
      } else {
        throw new Error('Signup failed');
      }
    } catch (error: any) {
      logAuthEvent('Sign up failed', { error: error.message }, true);
      throw error;
    }
  };

  const signOut = async () => {
    logAuthEvent('Sign out attempt');
    
    try {
      await authApi.logout();
      setUser(null);
      setProfile(null);
      logAuthEvent('Sign out successful');
    } catch (error: any) {
      logAuthEvent('Sign out error', error, true);
      // Still clear local state even if API call fails
      setUser(null);
      setProfile(null);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    logAuthEvent('Password reset attempt', { email: email.substring(0, 3) + '***' });
    
    try {
      await authApi.forgotPassword(email);
      logAuthEvent('Password reset email sent successfully');
    } catch (error: any) {
      logAuthEvent('Password reset failed', error, true);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    logAuthEvent('Profile update attempt', { updates: Object.keys(updates) });
    
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      
      const response = await authApi.updateProfile(updates);
      
      if (response.success && response.user) {
        setUser(response.user);
        setProfile(response.user);
        logAuthEvent('Profile updated successfully');
      }
    } catch (error: any) {
      logAuthEvent('Profile update failed', error, true);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

