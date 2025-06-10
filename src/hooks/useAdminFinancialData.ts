
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export const useAdminFinancialData = (startDate?: string, endDate?: string) => {
  // Default to last 30 days if no dates provided
  const defaultEndDate = format(new Date(), 'yyyy-MM-dd');
  const defaultStartDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  
  const finalStartDate = startDate || defaultStartDate;
  const finalEndDate = endDate || defaultEndDate;

  const { data: financialOverview, isLoading: financialOverviewLoading } = useQuery({
    queryKey: ['admin-financial-overview', finalStartDate, finalEndDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_financial_overview', {
        start_date: finalStartDate,
        end_date: finalEndDate
      });
      if (error) throw error;
      return data[0] || { total_issued: 0, total_paid: 0, total_overdue: 0 };
    }
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions', finalStartDate, finalEndDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          status,
          amount,
          created_at,
          due_date,
          paid_date,
          profiles!payments_owner_id_fkey(full_name, display_name)
        `)
        .gte('created_at', finalStartDate)
        .lte('created_at', finalEndDate + 'T23:59:59')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  return {
    financialOverview,
    transactions,
    isLoading: financialOverviewLoading || transactionsLoading
  };
};
