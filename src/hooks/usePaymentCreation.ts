
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateAmount, sanitizeTextInput } from '@/utils/securityValidation';
import { sanitizePaymentFormData } from '@/components/payments/PaymentFormValidation';
import { validateDueDateReceitaSaude, validatePaymentDateReceitaSaude } from '@/utils/receitaSaudeValidation';
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

      // Validação robusta do valor
      if (!validateAmount(formData.amount)) {
        throw new Error('Valor deve estar entre R$ 0,01 e R$ 999.999.999,99');
      }

      // Validação de descrição
      if (!formData.description || formData.description.length < 3) {
        throw new Error('Descrição deve ter pelo menos 3 caracteres');
      }
      if (formData.description.length > 500) {
        throw new Error('Descrição deve ter no máximo 500 caracteres');
      }

      // Validação Receita Saúde para data de vencimento
      if (formData.due_date) {
        const dueDateValidation = validateDueDateReceitaSaude(formData.due_date);
        if (!dueDateValidation.isValid) {
          throw new Error(dueDateValidation.errorMessage);
        }
      }

      // Validar due date APENAS para payment links, não para manual charges
      if (formData.chargeType === 'link' && formData.due_date) {
        const dueDate = new Date(formData.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          throw new Error('Data de vencimento deve ser hoje ou no futuro para links de pagamento');
        }
      }

      // Validação Receita Saúde para data de recebimento (se marcado como recebido)
      if (formData.isReceived && formData.receivedDate) {
        const paymentDateValidation = validatePaymentDateReceitaSaude(formData.receivedDate);
        if (!paymentDateValidation.isValid) {
          throw new Error(paymentDateValidation.errorMessage);
        }
      }

      // Sanitizar dados antes de salvar
      const sanitizedData = sanitizePaymentFormData({
        patient_id: formData.patient_id,
        amount: formData.amount,
        due_date: formData.due_date,
        description: formData.description,
        payer_cpf: formData.payer_cpf
      });

      const paymentData = {
        ...sanitizedData,
        status: (formData.isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: formData.isReceived ? formData.receivedDate : null,
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

      // Se for um link payment, chamar Pagar.me para criar a transação
      if (newPayment.has_payment_link) {
        // Determine payment methods to create
        const paymentMethods = [];
        if (formData.paymentMethods.boleto) paymentMethods.push('pix');
        if (formData.paymentMethods.creditCard) paymentMethods.push('credit_card');

        const primaryMethod = paymentMethods.includes('pix') ? 'pix' : 'credit_card';

        const { error: pagarmeError } = await supabase.functions.invoke('create-pagarme-transaction', {
          body: {
            payment_id: newPayment.id,
            payment_method: primaryMethod
          }
        });

        if (pagarmeError) {
          console.error('Pagar.me transaction creation failed:', pagarmeError);
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
      
      // Send email if notification is enabled
      if (formData.sendEmailNotification && formData.email && selectedPatient) {
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

      // Check if payment has receita saude receipt issued - block editing
      if (paymentToEdit.receita_saude_receipt_issued) {
        throw new Error('Não é possível editar uma cobrança com recibo emitido. Desmarque no Controle Receita Saúde para permitir alterações.');
      }

      // Validação robusta do valor
      if (!validateAmount(formData.amount)) {
        throw new Error('Valor deve estar entre R$ 0,01 e R$ 999.999.999,99');
      }

      // Validação de descrição
      if (!formData.description || formData.description.length < 3) {
        throw new Error('Descrição deve ter pelo menos 3 caracteres');
      }
      if (formData.description.length > 500) {
        throw new Error('Descrição deve ter no máximo 500 caracteres');
      }

      // Validação Receita Saúde para data de vencimento
      if (formData.due_date) {
        const dueDateValidation = validateDueDateReceitaSaude(formData.due_date);
        if (!dueDateValidation.isValid) {
          throw new Error(dueDateValidation.errorMessage);
        }
      }

      // Validar due date APENAS para payment links, não para manual charges
      if (paymentToEdit.has_payment_link && formData.due_date) {
        const dueDate = new Date(formData.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          throw new Error('Data de vencimento deve ser hoje ou no futuro para links de pagamento');
        }
      }

      // Validação Receita Saúde para data de recebimento (se marcado como recebido)
      if (formData.isReceived && formData.receivedDate) {
        const paymentDateValidation = validatePaymentDateReceitaSaude(formData.receivedDate);
        if (!paymentDateValidation.isValid) {
          throw new Error(paymentDateValidation.errorMessage);
        }
      }

      // Sanitizar dados antes de salvar
      const sanitizedData = sanitizePaymentFormData({
        patient_id: formData.patient_id,
        amount: formData.amount,
        due_date: formData.due_date,
        description: formData.description,
        payer_cpf: formData.payer_cpf
      });

      const paymentData = {
        ...sanitizedData,
        status: (formData.isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: formData.isReceived ? formData.receivedDate : null,
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
      toast.error(error.message || 'Erro ao atualizar cobrança');
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
