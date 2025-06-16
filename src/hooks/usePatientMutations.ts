
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkForDuplicates } from '@/utils/patientDuplicateChecker';
import { Patient } from '@/types/patient';
import { useState } from 'react';

interface PatientFormData {
  full_name: string;
  patient_type: "individual" | "company";
  cpf: string;
  cnpj: string;
  email: string;
  phone: string;
  has_financial_guardian: boolean;
  guardian_cpf: string;
  is_payment_from_abroad: boolean;
}

interface DeletedPatient {
  id: string;
  full_name: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
}

export const usePatientMutations = (userId: string | undefined, onClose: () => void) => {
  const queryClient = useQueryClient();
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [deletedPatient, setDeletedPatient] = useState<DeletedPatient | null>(null);
  const [pendingFormData, setPendingFormData] = useState<PatientFormData | null>(null);

  const reactivatePatientMutation = useMutation({
    mutationFn: async ({ patientId, data }: { patientId: string; data: PatientFormData }) => {
      // Build the patient data object with only the relevant fields
      const patientData: any = {
        full_name: data.full_name.trim(),
        patient_type: data.patient_type,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        has_financial_guardian: data.has_financial_guardian,
        is_payment_from_abroad: data.is_payment_from_abroad,
        deleted_at: null, // Reactivate by clearing deleted_at
      };
      
      // Clean and include only relevant document field
      if (data.patient_type === 'individual') {
        patientData.cpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
        patientData.cnpj = null;
      } else {
        patientData.cpf = null;
        patientData.cnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null;
      }
      
      // Clean guardian CPF if present
      if (data.has_financial_guardian && data.guardian_cpf) {
        patientData.guardian_cpf = data.guardian_cpf.replace(/\D/g, '');
      } else {
        patientData.guardian_cpf = null;
      }

      const { error } = await supabase
        .from('patients')
        .update(patientData)
        .eq('id', patientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-count'] });
      toast.success('Paciente reativado com sucesso!');
      setShowReactivateModal(false);
      setDeletedPatient(null);
      setPendingFormData(null);
      onClose();
    },
    onError: (error) => {
      console.error('Error reactivating patient:', error);
      toast.error('Erro ao reativar paciente');
    }
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      if (!userId) throw new Error('User not authenticated');
      
      // Check for duplicates before creating
      const duplicateResult = await checkForDuplicates(data, userId);
      
      if (duplicateResult.isDuplicate) {
        if (duplicateResult.message === 'REACTIVATE_PATIENT' && duplicateResult.deletedPatient) {
          // Show reactivate modal
          setDeletedPatient(duplicateResult.deletedPatient);
          setPendingFormData(data);
          setShowReactivateModal(true);
          throw new Error('SHOW_REACTIVATE_MODAL');
        } else {
          throw new Error(duplicateResult.message);
        }
      }
      
      // Build the patient data object with only the relevant fields
      const patientData: any = {
        full_name: data.full_name.trim(),
        patient_type: data.patient_type,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        has_financial_guardian: data.has_financial_guardian,
        is_payment_from_abroad: data.is_payment_from_abroad,
        owner_id: userId
      };
      
      // Clean and include only relevant document field
      if (data.patient_type === 'individual') {
        patientData.cpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
        patientData.cnpj = null;
      } else {
        patientData.cpf = null;
        patientData.cnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null;
      }
      
      // Clean guardian CPF if present
      if (data.has_financial_guardian && data.guardian_cpf) {
        patientData.guardian_cpf = data.guardian_cpf.replace(/\D/g, '');
      } else {
        patientData.guardian_cpf = null;
      }

      const { error } = await supabase
        .from('patients')
        .insert(patientData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-count'] });
      toast.success('Paciente criado com sucesso!');
      onClose();
    },
    onError: (error) => {
      if (error.message === 'SHOW_REACTIVATE_MODAL') {
        // Modal will be shown, don't show error toast
        return;
      }
      console.error('Error creating patient:', error);
      toast.error(error.message || 'Erro ao criar paciente');
    }
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ data, patientId }: { data: PatientFormData; patientId: string }) => {
      if (!patientId) throw new Error('Patient ID is required for update');
      
      // Check for duplicates before updating
      const duplicateResult = await checkForDuplicates(data, userId!, patientId);
      if (duplicateResult.isDuplicate) {
        throw new Error(duplicateResult.message);
      }
      
      // Build the patient data object with properly cleaned fields
      const patientData: any = {
        full_name: data.full_name.trim(),
        patient_type: data.patient_type,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        has_financial_guardian: data.has_financial_guardian,
        is_payment_from_abroad: data.is_payment_from_abroad,
      };
      
      // Clean and include only relevant document field
      if (data.patient_type === 'individual') {
        patientData.cpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
        patientData.cnpj = null;
      } else {
        patientData.cpf = null;
        patientData.cnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null;
      }
      
      // Clean guardian CPF if present
      if (data.has_financial_guardian && data.guardian_cpf) {
        patientData.guardian_cpf = data.guardian_cpf.replace(/\D/g, '');
      } else {
        patientData.guardian_cpf = null;
      }
      
      const { error } = await supabase
        .from('patients')
        .update(patientData)
        .eq('id', patientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente atualizado com sucesso!');
      onClose();
    },
    onError: (error) => {
      console.error('Error updating patient:', error);
      toast.error(error.message || 'Erro ao atualizar paciente');
    }
  });

  const handleReactivateConfirm = () => {
    if (deletedPatient && pendingFormData) {
      reactivatePatientMutation.mutate({
        patientId: deletedPatient.id,
        data: pendingFormData
      });
    }
  };

  const handleReactivateCancel = () => {
    setShowReactivateModal(false);
    setDeletedPatient(null);
    setPendingFormData(null);
  };

  return {
    createPatientMutation,
    updatePatientMutation,
    reactivatePatientMutation,
    isLoading: createPatientMutation.isPending || updatePatientMutation.isPending || reactivatePatientMutation.isPending,
    showReactivateModal,
    deletedPatient,
    handleReactivateConfirm,
    handleReactivateCancel
  };
};
