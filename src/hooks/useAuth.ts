import { useState, useEffect, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { getCurrentImpersonation } from '../lib/impersonation';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'advisor' | 'admin' | 'affiliate';
  preferredLanguage: 'en' | 'pt';
  createdAt: Date;
  updatedAt: Date;
  avatar_url?: string;
  last_login?: Date;
  user_metadata?: any;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  session: Session | null;
  checkRole: (requiredRole: string | string[]) => boolean;
}

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Function to set user from Supabase user data
  const setUserFromSupabaseUser = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      // Check if we're impersonating someone
      const impersonation = getCurrentImpersonation();
      
      if (impersonation) {
        // If impersonating, get the target user's details
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', impersonation.targetUserId)
          .single();
        
        if (error || !data) {
          console.error('Error getting impersonated user details:', error);
          // Fall back to the admin user if we can't get the impersonated user
        } else {
          // Create user object from the impersonated user
          const impersonatedUser: User = {
            id: data.id,
            email: data.email,
            name: data.full_name || impersonation.targetName,
            role: data.role as User['role'],
            preferredLanguage: data.preferred_language || 'en',
            avatar_url: data.avatar_url,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at || data.created_at),
            last_login: data.last_login ? new Date(data.last_login) : undefined
          };
          
          setUser(impersonatedUser);
          return;
        }
      }
      
      // Fetch additional user data from the users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .limit(1);

      // If we have user data in the database, use it
      if (data && data.length > 0 && !error) {
        const userData = data[0];
        const userObject: User = {
          id: supabaseUser.id,
          email: userData.email || supabaseUser.email || '',
          name: userData.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          role: userData.role as User['role'],
          preferredLanguage: userData.preferred_language || 'en',
          avatar_url: userData.avatar_url,
          createdAt: new Date(userData.created_at),
          updatedAt: new Date(userData.updated_at || userData.created_at),
          last_login: userData.last_login ? new Date(userData.last_login) : undefined,
          user_metadata: supabaseUser.user_metadata
        };
        setUser(userData);
        
        // Update last_login if it's been more than an hour since the last update
        const lastLoginTime = userData.last_login ? new Date(userData.last_login).getTime() : 0;
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        if (lastLoginTime < oneHourAgo) {
          // Update last_login in the database
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', supabaseUser.id);
        }
      } else {
        console.log('User data not found in database, using auth data');
        // Fall back to auth data if we can't get user data from the database
        // Get role from app_metadata (secure, server-controlled) first
        // Fall back to user_metadata (less secure) if needed
        const role = 
          supabaseUser.app_metadata?.role || 
          supabaseUser.user_metadata?.role || 
          'member';
          
        const userData: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          role: role as User['role'],
          preferredLanguage: supabaseUser.user_metadata?.preferred_language || 'en',
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          createdAt: new Date(supabaseUser.created_at),
          updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
          last_login: supabaseUser.last_sign_in_at ? new Date(supabaseUser.last_sign_in_at) : undefined,
          user_metadata: supabaseUser.user_metadata
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error setting user from Supabase user:', error);
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    // Test Supabase connection first
    testSupabaseConnection().then((connected) => {
      if (!connected) {
        console.error('Failed to connect to Supabase');
        setAuthError('Failed to connect to authentication service');
        setLoading(false);
        return;
      }

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          setUserFromSupabaseUser(session.user);
        }
        setAuthError(null);
        setLoading(false);
      }).catch((error) => {
        console.error('Error getting initial session:', error);
        // Handle refresh token errors gracefully
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('Invalid Refresh Token')) {
          console.log('Refresh token expired, clearing session');
          setSession(null);
          setUser(null);
          setAuthError('Session expired. Please log in again.');
        } else {
          setAuthError('Authentication error. Please try again.');
        }
        setLoading(false);
      });

      // Set up auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event);
        
        // Handle auth errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token refresh failed, clearing session');
          setAuthError('Session expired. Please log in again.');
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        if (session?.user) {
          await setUserFromSupabaseUser(session.user);
        } else {
          setUser(null);
        }
        setAuthError(null);
        setLoading(false);
      });

      // Set up token refresh
      const setupTokenRefresh = async () => {
        try {
          // Check token expiry and refresh if needed
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            const expiresAt = data.session.expires_at;
            if (expiresAt) {
              const expiresAtDate = new Date(expiresAt * 1000);
              const now = new Date();
              const timeUntilExpiry = expiresAtDate.getTime() - now.getTime();
              
              // If token expires in less than 1 hour, refresh it
              if (timeUntilExpiry < 60 * 60 * 1000) {
                const { data: refreshData, error } = await supabase.auth.refreshSession();
                if (!error && refreshData.session) {
                  setSession(refreshData.session);
                  await setUserFromSupabaseUser(refreshData.session.user);
                }
              }
              
              // Set up a timer to refresh the token before it expires
              const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 0); // 5 minutes before expiry
              const refreshTimer = setTimeout(async () => {
                const { data: refreshData, error } = await supabase.auth.refreshSession();
                if (!error && refreshData.session) {
                  setSession(refreshData.session);
                  await setUserFromSupabaseUser(refreshData.session.user);
                }
              }, refreshTime);
              
              return () => clearTimeout(refreshTimer);
            }
          }
        } catch (error) {
          console.error('Error setting up token refresh:', error);
        }
      };
      
      setupTokenRefresh();

      return () => {
        subscription.unsubscribe();
      };
    });
  }, [setUserFromSupabaseUser]);

  // Check for role changes periodically
  useEffect(() => {
    if (!user) return;
    
    // Check for role changes every 5 minutes
    const roleCheckInterval = setInterval(async () => {
      try {
        // Check if user role has changed
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (!error && data && data.role !== user.role) {
          // Role has changed, update user
          setUser(prev => prev ? { ...prev, role: data.role as User['role'] } : null);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(roleCheckInterval);
  }, [user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      // Test connection first
      const connected = await testSupabaseConnection();
      if (!connected) {
        throw new Error('Unable to connect to authentication service. Please check your internet connection and try again.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      if (data.user) {
        await setUserFromSupabaseUser(data.user);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before logging in.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setAuthError(null);
      
      // Clear any impersonation data
      localStorage.removeItem('saudemax_impersonation');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.name,
          preferred_language: data.preferredLanguage,
          avatar_url: data.avatar_url
        }
      });
      
      if (authError) throw authError;

      // Update users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: data.name,
          preferred_language: data.preferredLanguage,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed');
    }
  };

  // Function to check if user has required role(s)
  const checkRole = (requiredRole: string | string[]): boolean => {
    if (!user) return false;
    
    // Check if user has affiliate_access in metadata
    if (user.user_metadata?.affiliate_access && 
        (requiredRole === 'affiliate' || 
         (Array.isArray(requiredRole) && requiredRole.includes('affiliate')))) {
      return true;
    }
    
    // Check app_metadata first (more secure)
    const appMetadataRole = user.user_metadata?.role;
    if (appMetadataRole) {
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(appMetadataRole);
      }
      return appMetadataRole === requiredRole;
    }
    
    // Fall back to user.role
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  };

  return {
    user,
    loading,
    login,
    logout,
    updateProfile,
    session,
    checkRole,
    authError
  };
};