
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export const useAdminDashboardData = (startDate?: string, endDate?: string) => {
  // Default to last 30 days if no dates provided
  const defaultEndDate = format(new Date(), 'yyyy-MM-dd');
  const defaultStartDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  
  const finalStartDate = startDate || defaultStartDate;
  const finalEndDate = endDate || defaultEndDate;

  const { data: userKpis, isLoading: userKpisLoading } = useQuery({
    queryKey: ['admin-user-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_user_kpis');
      if (error) throw error;
      return data[0] || { total_users: 0, new_users_last_30_days: 0, inactive_users: 0 };
    }
  });

  const { data: userKpisByPlan, isLoading: userKpisByPlanLoading } = useQuery({
    queryKey: ['admin-user-kpis-by-plan'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_user_kpis_by_plan');
      if (error) throw error;
      return data[0] || { 
        total_users_free: 0,
        total_users_gestao: 0, 
        total_users_psi_regular: 0,
        new_users_free_30_days: 0,
        new_users_gestao_30_days: 0,
        new_users_psi_regular_30_days: 0
      };
    }
  });

  const { data: userGrowth, isLoading: userGrowthLoading } = useQuery({
    queryKey: ['admin-user-growth', finalStartDate, finalEndDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_user_growth', {
        start_date: finalStartDate,
        end_date: finalEndDate
      });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: userGrowthByPlan, isLoading: userGrowthByPlanLoading } = useQuery({
    queryKey: ['admin-user-growth-by-plan', finalStartDate, finalEndDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_user_growth_by_plan', {
        start_date: finalStartDate,
        end_date: finalEndDate
      });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: topEarners, isLoading: topEarnersLoading } = useQuery({
    queryKey: ['admin-top-earners'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_earning_users', {
        limit_count: 10
      });
      if (error) throw error;
      return data || [];
    }
  });

  // New financial metrics queries
  const { data: mrrMetrics, isLoading: mrrMetricsLoading } = useQuery({
    queryKey: ['admin-mrr-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_mrr_metrics');
      if (error) throw error;
      return data[0] || { total_mrr: 0, mrr_free: 0, mrr_gestao: 0, mrr_psi_regular: 0, mrr_growth_rate: 0 };
    }
  });

  const { data: churnMetrics, isLoading: churnMetricsLoading } = useQuery({
    queryKey: ['admin-churn-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_churn_metrics');
      if (error) throw error;
      return data[0] || { monthly_churn_rate: 0, total_cancellations_30_days: 0, retention_rate: 0, active_subscribers: 0 };
    }
  });

  const { data: ltvMetrics, isLoading: ltvMetricsLoading } = useQuery({
    queryKey: ['admin-ltv-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ltv_metrics');
      if (error) throw error;
      return data[0] || { avg_ltv_gestao: 0, avg_ltv_psi_regular: 0, avg_subscription_duration_days: 0 };
    }
  });

  const { data: conversionMetrics, isLoading: conversionMetricsLoading } = useQuery({
    queryKey: ['admin-conversion-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_conversion_metrics');
      if (error) throw error;
      return data[0] || { free_to_paid_rate: 0, gestao_to_psi_regular_rate: 0, total_conversions_30_days: 0 };
    }
  });

  return {
    userKpis,
    userKpisByPlan,
    userGrowth,
    userGrowthByPlan,
    topEarners,
    mrrMetrics,
    churnMetrics,
    ltvMetrics,
    conversionMetrics,
    isLoading: userKpisLoading || userKpisByPlanLoading || userGrowthLoading || userGrowthByPlanLoading || 
               topEarnersLoading || mrrMetricsLoading || churnMetricsLoading || ltvMetricsLoading || conversionMetricsLoading
  };
};
