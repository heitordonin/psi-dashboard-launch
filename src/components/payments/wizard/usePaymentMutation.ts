
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WizardFormData } from './types';
import type { Patient } from '@/types/patient';
import type { Payment } from '@/types/payment';

interface UsePaymentMutationProps {
  formData: WizardFormData;
  selectedPatient: Patient | undefined;
  isEditMode: boolean;
  paymentToEdit: Payment | null;
  onSuccess?: () => void;
  onClose: () => void;
}

export function usePaymentMutation({
  formData,
  selectedPatient,
  isEditMode,
  paymentToEdit,
  onSuccess,
  onClose
}: UsePaymentMutationProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const paymentData = {
        patient_id: formData.patient_id,
        amount: formData.amount,
        due_date: formData.due_date,
        description: formData.description,
        status: (formData.isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: formData.isReceived ? formData.receivedDate : null,
        payer_cpf: formData.payer_cpf,
        receita_saude_receipt_issued: false,
        has_payment_link: formData.chargeType === 'link',
        owner_id: user.id
      };

      if (isEditMode && paymentToEdit) {
        const { data, error } = await supabase
          .from('payments')
          .update(paymentData)
          .eq('id', paymentToEdit.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('payments')
          .insert(paymentData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(isEditMode ? 'Cobrança atualizada com sucesso!' : 'Cobrança criada com sucesso!');
      
      // Send email if notification is enabled and it's a link charge (only for new payments)
      if (!isEditMode && formData.chargeType === 'link' && formData.sendEmailNotification && formData.email && selectedPatient) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-email-reminder', {
            body: {
              paymentId: data.id,
              recipientEmail: formData.email,
              amount: formData.amount,
              patientName: selectedPatient.full_name,
              dueDate: formData.due_date,
              description: formData.description
            }
          });

          if (emailError) {
            console.error('Error sending email:', emailError);
            toast.error('Cobrança criada, mas houve erro ao enviar o email');
          } else {
            toast.success('Email de lembrete enviado com sucesso!');
          }
        } catch (error) {
          console.error('Error sending email:', error);
          toast.error('Cobrança criada, mas houve erro ao enviar o email');
        }
      }
      
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      console.error('Error creating/updating payment:', error);
      toast.error(isEditMode ? 'Erro ao atualizar cobrança' : 'Erro ao criar cobrança');
    }
  });
}
