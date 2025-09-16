import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentWithPatient } from "@/types/payment";

export const usePatientCharges = (userId: string | undefined, patientId?: string) => {
  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['patient-charges', userId, patientId],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
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
        .eq('owner_id', userId);
      
      // If specific patient is requested, filter by patient_id
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PaymentWithPatient[];
    },
    enabled: !!userId
  });

  return {
    charges,
    isLoading
  };
};