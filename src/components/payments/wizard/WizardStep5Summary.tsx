
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

interface WizardStep5Props {
  formData: WizardFormData;
  patients: Patient[];
  onSuccess?: () => void;
  onClose: () => void;
}

export function WizardStep5Summary({
  formData,
  patients,
  onSuccess,
  onClose
}: WizardStep5Props) {
  const queryClient = useQueryClient();
  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const paymentData = {
        patient_id: formData.patient_id,
        amount: formData.amount,
        due_date: formData.due_date,
        description: formData.description,
        status: formData.isReceived ? 'paid' : 'pending',
        paid_date: formData.isReceived ? formData.receivedDate : null,
        payer_cpf: formData.payer_cpf,
        receita_saude_receipt_issued: false,
        owner_id: user.id
      };

      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança criada com sucesso!');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      console.error('Error creating payment:', error);
      toast.error('Erro ao criar cobrança');
    }
  });

  const paymentMethods = Object.entries(formData.paymentMethods)
    .filter(([_, enabled]) => enabled)
    .map(([method]) => method === 'boleto' ? 'Boleto' : 'Cartão de Crédito');

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
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Métodos:</span>
                <span className="text-right">{paymentMethods.join(', ')}</span>
              </div>
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
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">CPF do Pagador:</span>
                <span>{formData.payer_cpf}</span>
              </div>
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
            </CardContent>
          </Card>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isReceived"
              checked={formData.isReceived}
              onCheckedChange={(checked) => {
                const updates: Partial<WizardFormData> = { isReceived: !!checked };
                if (checked) {
                  updates.receivedDate = new Date().toISOString().split('T')[0];
                }
                // This would need to be passed from parent component
                // updateFormData(updates);
              }}
            />
            <Label htmlFor="isReceived">Marcar como já recebido</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={() => createPaymentMutation.mutate()}
          disabled={createPaymentMutation.isPending}
        >
          {createPaymentMutation.isPending ? 'Criando...' : 'Criar Cobrança'}
        </Button>
      </div>
    </div>
  );
}
