
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Secure authentication hook with proper admin checking
 */
export const useSecureAuth = () => {
  const { user, isLoading: authLoading, isAdmin: contextIsAdmin, isCheckingAdmin } = useAuth();

  // Double-check admin status using database function for critical operations
  const { data: isAdminVerified, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-verification', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
      
      if (error) {
        console.error('Error verifying admin status:', error);
        return false;
      }
      
      return data === true;
    },
    enabled: !!user?.id,
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

  return {
    user: secureUser,
    isAuthenticated: !!user,
    isLoading: authLoading || isCheckingAdmin,
    isAdmin: contextIsAdmin && isAdminVerified, // Both checks must pass
    isAdminLoading: adminLoading,
    // Secure method to check if user can perform admin actions
    canPerformAdminAction: () => {
      return !!user && contextIsAdmin && isAdminVerified;
    }
  };
};
