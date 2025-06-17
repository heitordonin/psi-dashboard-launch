
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMemo } from 'react';

/**
 * Hook de autenticação segura simplificado - usa apenas dados do context
 */
export const useSecureAuth = () => {
  const { user, isLoading, isAdmin } = useAuth();

  // Objeto de usuário seguro que não expõe dados sensíveis
  const secureUser = useMemo(() => {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.email_confirmed_at !== null,
      createdAt: user.created_at
    };
  }, [user]);

  // Verificação simples se o usuário pode realizar ações de admin
  const canPerformAdminAction = useMemo(() => {
    return !!user && isAdmin;
  }, [user, isAdmin]);

  if (import.meta.env.MODE === 'development') {
    console.log('useSecureAuth state:', {
      hasUser: !!user,
      isLoading,
      isAdmin,
      canPerformAdminAction
    });
  }

  return {
    user: secureUser,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    isAdminLoading: false, // Não há mais loading separado para admin
    canPerformAdminAction: () => canPerformAdminAction
  };
};
