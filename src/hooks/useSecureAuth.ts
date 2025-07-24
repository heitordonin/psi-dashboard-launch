
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
      
      try {
        const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
        
        if (error) {
          console.error('Error verifying admin status:', error);
          return false;
        }
        
        return data === true;
      } catch (error) {
        console.error('Admin verification failed:', error);
        return false;
      }
    },
    enabled: !!user?.id && contextIsAdmin, // Only verify if context suggests admin
    staleTime: 2 * 60 * 1000, // Reduced cache time for security
    retry: 1,
    refetchOnWindowFocus: true // Re-verify on window focus
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
