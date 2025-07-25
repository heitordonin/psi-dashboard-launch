
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSubscriptionSync } from '@/hooks/useAuthSubscriptionSync';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCheckingAdmin: boolean;
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
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Integrar sincronização automática de assinatura com auth
  useAuthSubscriptionSync(user, isLoading);

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (import.meta.env.MODE === 'development') {
          console.log('Auth state changed:', event, session?.user?.email);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Check admin status when user logs in or session changes
        if (session?.user) {
          setTimeout(async () => {
            setIsCheckingAdmin(true);
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();
              
              if (import.meta.env.MODE === 'development') {
                console.log('Admin check result:', profile?.is_admin);
              }
              setIsAdmin(profile?.is_admin || false);
            } catch (error) {
              console.error('Error checking admin status:', error);
              setIsAdmin(false);
            } finally {
              setIsCheckingAdmin(false);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsCheckingAdmin(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    const redirectUrl = `${window.location.origin}/login`;
    
    // Se userData contém phone, criar o número completo E.164
    let processedUserData = userData;
    if (userData?.phone) {
      const cleanedPhone = userData.phone.replace(/\D/g, '');
      processedUserData = {
        ...userData,
        phone_number: cleanedPhone, // Use phone_number instead of phone to avoid conflicts
        phone: undefined // Explicitly remove the old key
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
    isCheckingAdmin,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
