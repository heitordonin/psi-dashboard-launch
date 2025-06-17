
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type ProfileStatus = 'loading' | 'verified' | 'needs_verification' | 'needs_phone' | 'no_profile';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  profileStatus: ProfileStatus;
  profileData: {
    phone?: string;
    phoneVerified?: boolean;
    phoneCountryCode?: string;
  } | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const [profileData, setProfileData] = useState<{
    phone?: string;
    phoneVerified?: boolean;
    phoneCountryCode?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleAuthChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      if (import.meta.env.MODE === 'development') {
        console.log('SupabaseAuthContext: Auth state changed:', event, session?.user?.email);
      }
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          // Single query to fetch ALL profile data at once
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin, phone, phone_verified, phone_country_code')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;

          if (error || !profile) {
            if (import.meta.env.MODE === 'development') {
              console.log('SupabaseAuthContext: Profile not found or error:', error);
            }
            setIsAdmin(false);
            setProfileStatus('no_profile');
            setProfileData(null);
          } else {
            // Set admin status
            setIsAdmin(profile.is_admin || false);
            
            // Set profile data
            setProfileData({
              phone: profile.phone,
              phoneVerified: profile.phone_verified,
              phoneCountryCode: profile.phone_country_code
            });

            // Determine profile status based on phone verification
            if (profile.phone_verified) {
              setProfileStatus('verified');
            } else if (profile.phone) {
              setProfileStatus('needs_verification');
            } else {
              setProfileStatus('needs_phone');
            }

            if (import.meta.env.MODE === 'development') {
              console.log('SupabaseAuthContext: Profile loaded:', {
                isAdmin: profile.is_admin || false,
                phoneVerified: profile.phone_verified,
                hasPhone: !!profile.phone,
                profileStatus: profile.phone_verified ? 'verified' : (profile.phone ? 'needs_verification' : 'needs_phone')
              });
            }
          }
        } catch (error) {
          if (!mounted) return;
          console.error('SupabaseAuthContext: Error fetching profile:', error);
          setIsAdmin(false);
          setProfileStatus('no_profile');
          setProfileData(null);
        }
      } else {
        // User logged out - reset everything
        setIsAdmin(false);
        setProfileStatus('no_profile');
        setProfileData(null);
      }
      
      // Set loading to false only after ALL operations are complete
      if (mounted) {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          await handleAuthChange('INITIAL_SESSION', session);
        }
      } catch (error) {
        console.error('SupabaseAuthContext: Error during initialization:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    const redirectUrl = `${window.location.origin}/login`;
    
    let processedUserData = userData;
    if (userData?.phone) {
      const cleanedPhone = userData.phone.replace(/\D/g, '');
      processedUserData = {
        ...userData,
        phone_number: cleanedPhone,
        phone: undefined
      };
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: processedUserData
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const value = {
    user,
    session,
    isLoading,
    isAdmin,
    profileStatus,
    profileData,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
