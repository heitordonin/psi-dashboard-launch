
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WizardFormData } from '@/components/payments/wizard/types';
import type { Patient } from '@/types/patient';
import type { Payment } from '@/types/payment';

interface UsePaymentCreationProps {
  formData: WizardFormData;
  selectedPatient?: Patient;
  onSuccess?: () => void;
  onClose: () => void;
  paymentToEdit?: Payment | null;
}

export function usePaymentCreation({
  formData,
  selectedPatient,
  onSuccess,
  onClose,
  paymentToEdit
}: UsePaymentCreationProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!paymentToEdit;

  const createPaymentMutation = useMutation({
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

      const { data: newPayment, error: insertError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (insertError) throw insertError;

      // If it's a link payment, call Pagar.me to create the transaction
      if (newPayment.has_payment_link) {
        // Determine payment methods to create
        const paymentMethods = [];
        if (formData.paymentMethods.boleto) paymentMethods.push('pix');
        if (formData.paymentMethods.creditCard) paymentMethods.push('credit_card');

        // For now, we'll create a PIX transaction by default
        // In a future enhancement, we could create multiple transactions for different methods
        const primaryMethod = paymentMethods.includes('pix') ? 'pix' : 'credit_card';

        const { error: pagarmeError } = await supabase.functions.invoke('create-pagarme-transaction', {
          body: {
            payment_id: newPayment.id,
            payment_method: primaryMethod
          }
        });

        if (pagarmeError) {
          console.error('Pagar.me transaction creation failed:', pagarmeError);
          // Don't throw here - the payment was created successfully
          // We'll show a different message to the user
          throw new Error('Cobrança criada, mas houve erro ao gerar o link de pagamento. Tente novamente.');
        }
      }

      return newPayment;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      if (data.has_payment_link) {
        toast.success('Cobrança criada e link de pagamento gerado com sucesso!');
      } else {
        toast.success('Cobrança criada com sucesso!');
      }
      
      // Send email if notification is enabled and it's a link charge
      if (formData.chargeType === 'link' && formData.sendEmailNotification && formData.email && selectedPatient) {
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
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Erro ao criar cobrança');
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!paymentToEdit) throw new Error('No payment to update');

      const paymentData = {
        patient_id: formData.patient_id,
        amount: formData.amount,
        due_date: formData.due_date,
        description: formData.description,
        status: (formData.isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: formData.isReceived ? formData.receivedDate : null,
        payer_cpf: formData.payer_cpf,
      };

      const { data, error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', paymentToEdit.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança atualizada com sucesso!');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error('Erro ao atualizar cobrança');
    }
  });

  const handleSubmit = () => {
    if (isEditMode) {
      updatePaymentMutation.mutate();
    } else {
      createPaymentMutation.mutate();
    }
  };

  const isLoading = createPaymentMutation.isPending || updatePaymentMutation.isPending;

  return {
    handleSubmit,
    isLoading,
    isEditMode
  };
}
