import { useEffect } from 'react';
import { useSecureAuth } from './useSecureAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Secure admin guard hook that redirects non-admin users
 */
export const useSecureAdminGuard = () => {
  const { isAuthenticated, isAdmin, isLoading, canPerformAdminAction } = useSecureAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      toast.error('Acesso negado. Faça login para continuar.');
      navigate('/login');
      return;
    }

    if (!canPerformAdminAction()) {
      toast.error('Acesso negado. Você não tem permissões de administrador.');
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, isAdmin, isLoading, canPerformAdminAction, navigate]);

  return {
    isAuthorized: isAuthenticated && canPerformAdminAction(),
    isLoading
  };
};