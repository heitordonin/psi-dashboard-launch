
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Patient } from "@/types/patient";

export const usePatientsData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Ensure all patients have the required fields with defaults
      return data.map(patient => ({
        ...patient,
        patient_type: patient.patient_type || 'individual',
        cnpj: patient.cnpj || undefined
      })) as Patient[];
    },
    enabled: !!user?.id
  });

  const { data: patientCount = 0 } = useQuery({
    queryKey: ['patients-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting patient:', error);
      toast.error('Erro ao excluir paciente');
    }
  });

  return {
    patients,
    patientCount,
    patientsLoading,
    deletePatientMutation
  };
};
