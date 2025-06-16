
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSecureAuth } from '@/hooks/useSecureAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAuthenticated, isLoading, canPerformAdminAction, isAdminLoading } = useSecureAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for ALL loading states to complete before making decisions
    if (!isLoading && !isAdminLoading) {
      if (!isAuthenticated) {
        if (import.meta.env.MODE === 'development') {
          console.log('AdminRoute: User not authenticated, redirecting to login');
        }
        navigate('/login');
      } else if (!canPerformAdminAction()) {
        if (import.meta.env.MODE === 'development') {
          console.log('AdminRoute: User not admin, redirecting to dashboard');
        }
        navigate('/dashboard');
      } else {
        if (import.meta.env.MODE === 'development') {
          console.log('AdminRoute: User is admin, granting access');
        }
      }
    }
  }, [user, isAuthenticated, isLoading, isAdminLoading, canPerformAdminAction, navigate]);

  // Show loading screen while ANY verification is in progress
  if (isLoading || isAdminLoading) {
    if (import.meta.env.MODE === 'development') {
      console.log('AdminRoute: Loading state - isLoading:', isLoading, 'isAdminLoading:', isAdminLoading);
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Verificando permissões de administrador...</p>
        </div>
      </div>
    );
  }

  // Additional safety check - only render if user is authenticated AND admin
  if (!isAuthenticated || !canPerformAdminAction()) {
    if (import.meta.env.MODE === 'development') {
      console.log('AdminRoute: Access denied - authenticated:', isAuthenticated, 'canPerformAdminAction:', canPerformAdminAction());
    }
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;
