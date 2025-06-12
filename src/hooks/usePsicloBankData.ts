
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentWithPatient } from "@/types/payment";

export const usePsicloBankData = (userId: string | undefined) => {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['psiclo-bank-data', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients (
            full_name,
            cpf,
            phone,
            email
          )
        `)
        .eq('owner_id', userId)
        .eq('has_payment_link', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PaymentWithPatient[];
    },
    enabled: !!userId
  });

  // Calculate metrics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalReceivedLast30Days = payments
    .filter(payment => 
      payment.status === 'paid' && 
      payment.paid_date && 
      new Date(payment.paid_date) >= thirtyDaysAgo
    )
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const totalPending = payments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const totalOverdue = payments
    .filter(payment => 
      payment.status === 'pending' && 
      new Date(payment.due_date) < now
    )
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const recentTransactions = payments.slice(0, 5);

  return {
    payments,
    isLoading,
    metrics: {
      totalReceivedLast30Days,
      totalPending,
      totalOverdue,
    },
    recentTransactions
  };
};
