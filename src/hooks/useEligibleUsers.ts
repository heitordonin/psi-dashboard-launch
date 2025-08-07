import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EligibleUser {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  cpf?: string;
  current_plan?: string;
  has_active_override: boolean;
}

export const useEligibleUsers = (searchTerm: string = "", showOnlyEligible: boolean = true) => {
  return useQuery({
    queryKey: ['eligible-users', searchTerm, showOnlyEligible],
    queryFn: async (): Promise<EligibleUser[]> => {
      try {
        // Get users with active paid subscriptions (gestao or psi_regular)
        const { data: subscriptions, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`
            user_id,
            subscription_plans!inner(slug, name)
          `)
          .eq('status', 'active')
          .in('subscription_plans.slug', ['gestao', 'psi_regular']);

        if (subError) throw subError;

        // Get active overrides to exclude users who already have them
        const { data: overrides, error: overrideError } = await supabase
          .from('subscription_overrides')
          .select('user_id')
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString())
          .or('expires_at.is.null');

        if (overrideError) throw overrideError;

        const usersWithOverrides = new Set(overrides?.map(o => o.user_id) || []);
        
        // Get user IDs from subscriptions
        const eligibleUserIds = subscriptions
          ?.filter(sub => !usersWithOverrides.has(sub.user_id))
          .map(sub => sub.user_id) || [];

        if (eligibleUserIds.length === 0) {
          return [];
        }

        // Build query for profiles
        let profileQuery = supabase
          .from('profiles')
          .select('id, full_name, display_name, cpf')
          .in('id', eligibleUserIds);

        // Add search filter if provided
        if (searchTerm && searchTerm.length >= 1) {
          const searchTermSafe = searchTerm.toLowerCase().trim();
          profileQuery = profileQuery.or(
            `full_name.ilike.%${searchTermSafe}%,display_name.ilike.%${searchTermSafe}%,cpf.ilike.%${searchTermSafe}%`
          );
        }

        const { data: profiles, error: profileError } = await profileQuery
          .order('full_name', { ascending: true })
          .limit(50);

        if (profileError) throw profileError;

        // Get emails from search users function (fallback)
        const authUsersMap = new Map<string, string>();
        try {
          const { data: searchData } = await supabase.functions.invoke('search-users', {
            body: { searchTerm: '' }, // Empty search to get all users
            method: 'POST'
          });
          
          if (searchData?.users) {
            searchData.users.forEach((user: any) => {
              if (user.id && user.email) {
                authUsersMap.set(user.id, user.email);
              }
            });
          }
        } catch (error) {
          console.warn('Could not fetch user emails:', error);
          // Continue without emails - not critical for functionality
        }

        // Get current plans for each user
        const planMap = new Map<string, string>();
        subscriptions?.forEach(sub => {
          planMap.set(sub.user_id, sub.subscription_plans.name);
        });

        // Combine data
        const users: EligibleUser[] = profiles?.map(profile => ({
          id: profile.id,
          email: authUsersMap.get(profile.id) || 'N/A',
          full_name: profile.full_name,
          display_name: profile.display_name,
          cpf: profile.cpf || undefined,
          current_plan: planMap.get(profile.id),
          has_active_override: usersWithOverrides.has(profile.id)
        })) || [];

        // Filter by eligibility if requested
        if (showOnlyEligible) {
          return users.filter(user => !user.has_active_override);
        }

        return users;
      } catch (error) {
        console.error('Error fetching eligible users:', error);
        throw error;
      }
    },
    enabled: !showOnlyEligible || searchTerm.length >= 0,
    staleTime: 30000, // 30 seconds
    retry: 1
  });
};