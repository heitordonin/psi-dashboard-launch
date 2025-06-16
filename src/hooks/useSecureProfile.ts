
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook for securely fetching user profile with automatic decryption
 */
export const useSecureProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: profile, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['secure-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Use the new RPC function to get decrypted profile data
      const { data, error } = await supabase.rpc('get_decrypted_profile');
      
      if (error) {
        console.error('Error fetching secure profile:', error);
        throw error;
      }
      
      // The RPC returns an array, but we expect only one profile for the current user
      return data?.[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1
  });

  // Function to invalidate and refresh profile data
  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['secure-profile'] });
  };

  return {
    profile,
    isLoading,
    error,
    refetch,
    refreshProfile,
    // Helper to check if profile data is available
    hasProfile: !!profile
  };
};
