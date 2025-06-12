
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Secure authentication hook with optimized admin checking
 */
export const useSecureAuth = () => {
  const { user, isLoading: authLoading, isAdmin: contextIsAdmin, isCheckingAdmin } = useAuth();

  // Only verify admin status for critical operations, with longer cache time
  const { data: isAdminVerified, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-verification', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error verifying admin status:', error);
        }
        return false;
      }
      
      return data === true;
    },
    enabled: !!user?.id && contextIsAdmin, // Only run if context says user is admin
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes instead of 5
    retry: false, // Don't retry on failure to prevent loops
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
    isAdmin: contextIsAdmin && (isAdminVerified !== false), // More lenient check
    isAdminLoading: adminLoading,
    // Secure method to check if user can perform admin actions
    canPerformAdminAction: () => {
      return !!user && contextIsAdmin && (isAdminVerified !== false);
    }
  };
};
