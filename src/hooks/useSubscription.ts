
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscriptionSync } from "@/contexts/SubscriptionSyncContext";
import type { SubscriptionPlan, UserSubscription, PlanFeature } from "@/types/subscription";

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { syncSubscription: syncSubscriptionMutex, state: syncState } = useSubscriptionSync();

  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or(`expires_at.gte.${new Date().toISOString()},expires_at.is.null`)
        .single();
      
      if (error) {
        console.error('Error fetching user subscription:', error);
        return null;
      }
      
      return data as UserSubscription;
    },
    enabled: !!user?.id
  });

  const { data: patientLimit } = useQuery({
    queryKey: ['patient-limit', user?.id],
    queryFn: async () => {
      if (!user?.id) return 3; // Default grátis limit
      
      const { data, error } = await supabase
        .rpc('get_user_patient_limit', { user_id: user.id });
      
      if (error) {
        console.error('Error fetching patient limit:', error);
        return 3;
      }
      
      return data as number;
    },
    enabled: !!user?.id
  });

  const { data: planFeatures } = useQuery({
    queryKey: ['plan-features', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_plan_features', { user_id: user.id });
      
      if (error) {
        console.error('Error fetching plan features:', error);
        return [];
      }
      
      return data as string[];
    },
    enabled: !!user?.id
  });

  const hasFeature = (feature: PlanFeature): boolean => {
    return planFeatures?.includes(feature) || false;
  };

  const refreshSubscription = async () => {
    // Invalidate all subscription-related queries before syncing
    queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    queryClient.invalidateQueries({ queryKey: ['patient-limit'] });
    queryClient.invalidateQueries({ queryKey: ['plan-features'] });
    
    return syncSubscriptionMutex();
  };

  const currentPlan = userSubscription?.subscription_plans;
  const isCancelledAtPeriodEnd = userSubscription?.cancel_at_period_end || false;

  return {
    userSubscription,
    currentPlan,
    patientLimit,
    planFeatures,
    hasFeature,
    refreshSubscription,
    isCancelledAtPeriodEnd,
    isLoading: subscriptionLoading || syncState.isLoading,
    syncError: syncState.error
  };
};

export const useSubscriptionPlans = () => {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');
      
      if (error) throw error;
      return data as SubscriptionPlan[];
    }
  });

  return { plans, isLoading };
};
