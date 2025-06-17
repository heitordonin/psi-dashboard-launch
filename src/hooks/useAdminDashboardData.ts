
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

  return {
    userKpis,
    userGrowth,
    topEarners,
    isLoading: userKpisLoading || userGrowthLoading || topEarnersLoading
  };
};
