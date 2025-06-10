
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Payment } from '@/types/payment';

interface FormData {
  patient_id: string;
  amount: number;
  due_date: string;
  description: string;
  payer_cpf: string;
}

export const usePaymentMutations = (
  userId: string | undefined,
  onSave?: (payment?: any) => void
) => {
  const queryClient = useQueryClient();

  const createPaymentMutation = useMutation({
    mutationFn: async (data: {
      formData: FormData;
      isReceived: boolean;
      receivedDate: string;
      paymentTitular: 'patient' | 'other';
    }) => {
      if (!userId) throw new Error('User not authenticated');
      
      const { formData, isReceived, receivedDate, paymentTitular } = data;
      
      const paymentData = {
        patient_id: formData.patient_id,
        amount: formData.amount,
        due_date: isReceived ? (formData.due_date || receivedDate) : formData.due_date,
        description: formData.description,
        owner_id: userId,
        status: (isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: isReceived ? receivedDate : null,
        payer_cpf: paymentTitular === 'other' ? formData.payer_cpf : null,
      };

      const { data: result, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (createdPayment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança criada com sucesso!');
      onSave?.(createdPayment);
    },
    onError: (error) => {
      console.error('Error creating payment:', error);
      toast.error('Erro ao criar cobrança');
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: {
      formData: FormData;
      isReceived: boolean;
      receivedDate: string;
      paymentTitular: 'patient' | 'other';
      paymentId: string;
    }) => {
      const { formData, isReceived, receivedDate, paymentTitular, paymentId } = data;
      
      const paymentData = {
        patient_id: formData.patient_id,
        amount: formData.amount,
        due_date: formData.due_date,
        description: formData.description,
        status: (isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: isReceived ? receivedDate : null,
        payer_cpf: paymentTitular === 'other' ? formData.payer_cpf : null,
      };

      const { data: result, error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (updatedPayment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança atualizada com sucesso!');
      onSave?.(updatedPayment);
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error('Erro ao atualizar cobrança');
    }
  });

  return {
    createPaymentMutation,
    updatePaymentMutation,
    isLoading: createPaymentMutation.isPending || updatePaymentMutation.isPending
  };
};
