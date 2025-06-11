
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { WizardFormData } from './types';
import type { Patient } from '@/types/patient';
import type { Payment } from '@/types/payment';

interface WizardStep5Props {
  formData: WizardFormData;
  patients: Patient[];
  onSuccess?: () => void;
  onClose: () => void;
  onPrevious: () => void;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  paymentToEdit?: Payment | null;
}

export function WizardStep5Summary({
  formData,
  patients,
  onSuccess,
  onClose,
  onPrevious,
  updateFormData,
  paymentToEdit
}: WizardStep5Props) {
  const queryClient = useQueryClient();
  const selectedPatient = patients.find(p => p.id === formData.patient_id);
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

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança criada com sucesso!');
      
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
      toast.error('Erro ao criar cobrança');
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

  const paymentMethods = formData.chargeType === 'link' 
    ? Object.entries(formData.paymentMethods)
        .filter(([_, enabled]) => enabled)
        .map(([method]) => method === 'boleto' ? 'Boleto' : 'Cartão de Crédito')
    : [];

  const getPayerInfo = () => {
    if (selectedPatient?.patient_type === 'company') {
      return formData.payer_cpf; // CNPJ
    }
    if (selectedPatient?.is_payment_from_abroad) {
      return formData.payer_cpf || 'Paciente do exterior';
    }
    return formData.payer_cpf;
  };

  const getPayerLabel = () => {
    if (selectedPatient?.patient_type === 'company') {
      return 'CNPJ do Pagador:';
    }
    if (selectedPatient?.is_payment_from_abroad) {
      return 'Documento do Pagador:';
    }
    return 'CPF do Pagador:';
  };

  const isLoading = createPaymentMutation.isPending || updatePaymentMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Resumo e Confirmação</h3>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes da Cobrança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tipo de Cobrança:</span>
                <Badge variant={formData.chargeType === 'link' ? 'default' : 'secondary'}>
                  {formData.chargeType === 'link' ? 'Com link de pagamento' : 'Manual'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <Badge variant="outline">
                  {formData.paymentType === 'single' ? 'Pagamento Único' : 'Assinatura'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Valor:</span>
                <span className="font-medium">R$ {formData.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vencimento:</span>
                <span>{format(new Date(formData.due_date), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Descrição:</span>
                <span className="text-right">{formData.description}</span>
              </div>
              {formData.chargeType === 'link' && paymentMethods.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Métodos:</span>
                  <span className="text-right">{paymentMethods.join(', ')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do Pagador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Paciente:</span>
                <span>{selectedPatient?.full_name}</span>
              </div>
              {!selectedPatient?.is_payment_from_abroad && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{getPayerLabel()}</span>
                  <span>{getPayerInfo()}</span>
                </div>
              )}
              {formData.chargeType === 'link' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Notificação por Email:</span>
                    <span>{formData.sendEmailNotification ? 'Sim' : 'Não'}</span>
                  </div>
                  {formData.sendEmailNotification && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span>{formData.email}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Checkbox "Marcar como já recebido" apenas para charges manuais */}
          {formData.chargeType === 'manual' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isReceived"
                checked={formData.isReceived}
                onCheckedChange={(checked) => updateFormData({ isReceived: !!checked })}
              />
              <Label htmlFor="isReceived">Marcar como já recebido</Label>
            </div>
          )}

          {/* Botão de ação */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isLoading}
            >
              Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (isEditMode ? 'Salvando...' : 'Criando...') : (isEditMode ? 'Salvar Alterações' : 'Concluir')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
