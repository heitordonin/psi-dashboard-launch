
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Secure authentication hook with proper admin checking and race condition prevention
 */
export const useSecureAuth = () => {
  const { user, isLoading: authLoading, isAdmin: contextIsAdmin, isCheckingAdmin } = useAuth();

  // Double-check admin status using database function for critical operations
  const { data: isAdminVerified, isLoading: adminQueryLoading } = useQuery({
    queryKey: ['admin-verification', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      if (import.meta.env.MODE === 'development') {
        console.log('useSecureAuth: Verifying admin status for user:', user.id);
      }
      
      const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
      
      if (error) {
        console.error('useSecureAuth: Error verifying admin status:', error);
        return false;
      }
      
      const result = data === true;
      if (import.meta.env.MODE === 'development') {
        console.log('useSecureAuth: Admin verification result:', result);
      }
      
      return result;
    },
    enabled: !!user?.id && !isCheckingAdmin, // Only run when user exists and context check is done
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1
  });

  // Secure user object that doesn't expose sensitive data
  const secureUser = user ? {
    id: user.id,
    email: user.email,
    emailVerified: user.email_confirmed_at !== null,
    createdAt: user.created_at
  } : null;

  // Comprehensive loading state that includes ALL async operations
  const isLoading = authLoading || isCheckingAdmin || (!!user && adminQueryLoading);
  
  // Both context and query verification must pass for admin access
  const isAdmin = !!user && contextIsAdmin && isAdminVerified === true;

  if (import.meta.env.MODE === 'development') {
    console.log('useSecureAuth state:', {
      hasUser: !!user,
      authLoading,
      isCheckingAdmin,
      adminQueryLoading,
      contextIsAdmin,
      isAdminVerified,
      finalIsLoading: isLoading,
      finalIsAdmin: isAdmin
    });
  }

  return {
    user: secureUser,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    isAdminLoading: adminQueryLoading,
    // Secure method to check if user can perform admin actions
    canPerformAdminAction: () => {
      const canPerform = !!user && contextIsAdmin && isAdminVerified === true;
      if (import.meta.env.MODE === 'development') {
        console.log('useSecureAuth: canPerformAdminAction check:', {
          hasUser: !!user,
          contextIsAdmin,
          isAdminVerified,
          result: canPerform
        });
      }
      return canPerform;
    }
  };
};
