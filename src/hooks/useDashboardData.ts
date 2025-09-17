
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createSafeDateFromString } from "@/utils/dateUtils";

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

      // For paid payments, filter by paid_date
      // For non-paid payments, filter by created_at
      if (startDate || endDate) {
        // Get all payments first, then filter based on appropriate date field
        const { data: allPayments, error } = await query;
        
        if (error) throw error;
        
        return allPayments.filter(payment => {
          let dateToCheck: string;
          
          // Use paid_date for paid payments, created_at for others
          if (payment.status === 'paid' && payment.paid_date) {
            dateToCheck = payment.paid_date;
          } else {
            dateToCheck = payment.created_at;
          }
          
          const checkDate = new Date(dateToCheck);
          const start = startDate ? createSafeDateFromString(startDate) : null;
          const end = endDate ? createSafeDateFromString(endDate) : null;
          if (end) {
            end.setHours(23, 59, 59, 999);
          }
          
          if (start && checkDate < start) return false;
          if (end && checkDate > end) return false;
          
          return true;
        });
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

      // For expenses, use payment_date instead of created_at
      if (startDate) {
        query = query.gte('payment_date', startDate);
      }
      if (endDate) {
        query = query.lte('payment_date', endDate);
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
    expenseTotal: expensesData.reduce((sum, e) => sum + Number(e.residential_adjusted_amount ?? e.amount), 0)
  };

  const isLoadingSummary = paymentsLoading || expensesLoading;

  return {
    summaryData,
    isLoadingSummary
  };
};
