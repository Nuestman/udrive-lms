import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Enhanced logging utility
const logAuthEvent = (event: string, data?: any, isError = false) => {
  const timestamp = new Date().toISOString();
  const logLevel = isError ? 'ERROR' : 'INFO';
  console.log(`[${timestamp}] [AUTH-${logLevel}] ${event}`, data || '');
  
  // In production, you might want to send this to a logging service
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
  role: 'admin' | 'manager' | 'employee';
  department?: string;
  position?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      logAuthEvent('Fetching user profile', { userId });
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logAuthEvent('Failed to fetch user profile', { userId, error: error.message }, true);
        throw error;
      }
      
      logAuthEvent('User profile fetched successfully', { userId, role: data.role });
      setProfile(data);
      setLoading(false);
    } catch (error) {
      logAuthEvent('Error in fetchUserProfile', error, true);
      setLoading(false);
    }
  };

  const signIn = async (credential: string, password: string) => {
    logAuthEvent('Sign in attempt', { credential: credential.substring(0, 3) + '***' });
    
    try {
      // Determine if credential is email or phone
      const isEmail = credential.includes('@');
      
      if (isEmail) {
        logAuthEvent('Signing in with email');
        const { error } = await supabase.auth.signInWithPassword({
          email: credential,
          password,
        });
        if (error) throw error;
      } else {
        logAuthEvent('Signing in with phone');
        const { error } = await supabase.auth.signInWithPassword({
          phone: credential,
          password,
        });
        if (error) throw error;
      }
      
      logAuthEvent('Sign in successful');
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
      // First, look up the tenant by subdomain to get the UUID
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', userData.tenant_id)
        .single();
      
      if (tenantError || !tenantData) {
        const errorMsg = `School with subdomain "${userData.tenant_id}" not found. Please check with your school administrator.`;
        logAuthEvent('Tenant lookup failed', { subdomain: userData.tenant_id, error: tenantError?.message }, true);
        throw new Error(errorMsg);
      }
      
      const tenantUuid = tenantData.id;
      logAuthEvent('Tenant found', { subdomain: userData.tenant_id, tenantId: tenantUuid });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            tenant_id: tenantUuid,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            role: userData.role
          }
        }
      });
      
      if (error) {
        logAuthEvent('Supabase auth.signUp failed', { error: error.message }, true);
        throw error;
      }
      
      if (!data.user) {
        const noUserError = 'No user returned from signUp';
        logAuthEvent('Sign up failed', { error: noUserError }, true);
        throw new Error(noUserError);
      }
      
      logAuthEvent('Supabase user created, creating profile', { userId: data.user.id });
      
      // Create user profile
      const profileData = {
        id: data.user.id,
        email,
        tenant_id: tenantUuid, // Use the actual UUID
        ...userData,
        tenant_id: tenantUuid, // Ensure we override any string value with UUID
      };
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData);
      
      if (profileError) {
        logAuthEvent('Failed to create user profile', { 
          userId: data.user.id, 
          error: profileError.message 
        }, true);
        throw profileError;
      }
      
      logAuthEvent('Sign up successful', { userId: data.user.id });
    } catch (error: any) {
      logAuthEvent('Sign up failed', { error: error.message }, true);
      throw error;
    }
  };

  const signOut = async () => {
    logAuthEvent('Sign out attempt');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logAuthEvent('Sign out failed', { error: error.message }, true);
        throw error;
      }
      
      logAuthEvent('Sign out successful');
    } catch (error: any) {
      logAuthEvent('Error in signOut', error, true);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    logAuthEvent('Password reset attempt', { email: email.substring(0, 3) + '***' });
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        logAuthEvent('Password reset failed', { error: error.message }, true);
        throw error;
      }
      
      logAuthEvent('Password reset email sent successfully');
    } catch (error: any) {
      logAuthEvent('Error in resetPassword', error, true);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    logAuthEvent('Profile update attempt', { updates: Object.keys(updates) });
    
    try {
      if (!user) {
        const noUserError = 'No user logged in';
        logAuthEvent('Profile update failed', { error: noUserError }, true);
        throw new Error(noUserError);
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) {
        logAuthEvent('Profile update failed', { error: error.message }, true);
        throw error;
      }
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      logAuthEvent('Profile updated successfully');
    } catch (error: any) {
      logAuthEvent('Error in updateProfile', error, true);
      throw error;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logAuthEvent('Error getting initial session', error, true);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};