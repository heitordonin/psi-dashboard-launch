
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardData = (startDate: string, endDate: string) => {
  const { user } = useAuth();

  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['dashboard-payments', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('payments')
        .select('*')
        .eq('owner_id', user.id);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: expensesData = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['dashboard-expenses', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('owner_id', user.id);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const summaryData = {
    receivedCount: paymentsData.filter(p => p.status === 'paid').length,
    receivedTotal: paymentsData
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pendingCount: paymentsData.filter(p => p.status === 'pending').length,
    pendingTotal: paymentsData
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    overdueCount: paymentsData.filter(p => p.status === 'pending' && new Date(p.due_date) < new Date()).length,
    overdueTotal: paymentsData
      .filter(p => p.status === 'pending' && new Date(p.due_date) < new Date())
      .reduce((sum, p) => sum + Number(p.amount), 0),
    expenseCount: expensesData.length,
    expenseTotal: expensesData.reduce((sum, e) => sum + Number(e.amount), 0)
  };

  const isLoadingSummary = paymentsLoading || expensesLoading;

  return {
    summaryData,
    isLoadingSummary
  };
};
