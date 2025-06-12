
import React from 'react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecureAdminWrapperProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Secure wrapper component that properly validates admin access
 */
export const SecureAdminWrapper = ({ children, requireAdmin = true }: SecureAdminWrapperProps) => {
  const { user, isAuthenticated, isLoading, isAdmin, isAdminLoading, canPerformAdminAction } = useSecureAuth();

  if (isLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Verificando permissões de administrador...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você precisa estar logado para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (requireAdmin && !canPerformAdminAction()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissões de administrador para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
