import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Payment } from "@/types/payment";
import type { Patient } from "@/types/patient";

export const usePaymentData = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .order('full_name');
      
      if (error) throw error;
      
      // Type cast to ensure patient_type is properly typed
      return data.map(patient => ({
        ...patient,
        patient_type: (patient.patient_type || 'individual') as 'individual' | 'company'
      })) as Patient[];
    },
    enabled: !!userId
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', userId],
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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-charges'] });
      toast.success('Cobrança excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting payment:', error);
      toast.error('Erro ao excluir cobrança');
    }
  });

  return {
    patients,
    payments,
    paymentsLoading,
    deletePaymentMutation
  };
};
