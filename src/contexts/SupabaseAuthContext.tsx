
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
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

  // Cache de verificação de admin para evitar múltiplas chamadas
  const [adminCheckCache, setAdminCheckCache] = useState<Record<string, boolean>>({});

  // Função para verificar status de admin com cache
  const checkAdminStatus = async (userId: string) => {
    // Se já temos o resultado em cache, usar ele
    if (adminCheckCache[userId] !== undefined) {
      setIsAdmin(adminCheckCache[userId]);
      return adminCheckCache[userId];
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      const adminStatus = !error && (profile?.is_admin || false);
      
      // Atualizar cache e estado
      setAdminCheckCache(prev => ({ ...prev, [userId]: adminStatus }));
      setIsAdmin(adminStatus);
      
      if (import.meta.env.MODE === 'development') {
        console.log('SupabaseAuthContext: Admin check result:', adminStatus);
      }
      
      return adminStatus;
    } catch (error) {
      console.error('SupabaseAuthContext: Exception during admin check:', error);
      setIsAdmin(false);
      setAdminCheckCache(prev => ({ ...prev, [userId]: false }));
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Função para lidar com mudanças de autenticação
    const handleAuthChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      if (import.meta.env.MODE === 'development') {
        console.log('SupabaseAuthContext: Auth state changed:', event, session?.user?.email);
      }
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Verificar admin status apenas se ainda montado
        await checkAdminStatus(session.user.id);
      } else {
        // User logged out - reset admin state
        setIsAdmin(false);
        setAdminCheckCache({});
      }
      
      // Definir loading como false apenas depois de todas as verificações
      if (mounted) {
        setIsLoading(false);
      }
    };

    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Obter sessão inicial
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        }
      } catch (error) {
        console.error('SupabaseAuthContext: Error during initialization:', error);
      } finally {
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
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
