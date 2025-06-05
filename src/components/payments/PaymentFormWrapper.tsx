
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PatientAndPayer } from './PatientAndPayer';
import { GuardianToggle } from './GuardianToggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ReceivedCheckbox } from './ReceivedCheckbox';
import type { Payment } from '@/types/payment';

interface FormData {
  patient_id: string;
  amount: string;
  due_date: string;
  description: string;
}

interface PaymentFormWrapperProps {
  payment?: Payment;
  onSave?: () => void;
  onCancel?: () => void;
}

export function PaymentFormWrapper({ payment, onSave, onCancel }: PaymentFormWrapperProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    patient_id: payment?.patient_id || '',
    amount: payment?.amount?.toString() || '',
    due_date: payment?.due_date || '',
    description: payment?.description || '',
  });

  const [isGuardianPayer, setIsGuardianPayer] = useState(false);
  const [guardianName, setGuardianName] = useState(payment?.guardian_name || '');
  const [isReceived, setIsReceived] = useState(payment?.status === 'paid');

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('owner_id', user.id)
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: { patient_id: string; amount: number; due_date: string; description: string; }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const paymentData = {
        ...data,
        owner_id: user.id,
        status: (isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        guardian_name: isGuardianPayer ? guardianName : null,
      };

      const { data: result, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança criada com sucesso!');
      onSave?.();
    },
    onError: (error) => {
      console.error('Error creating payment:', error);
      toast.error('Erro ao criar cobrança');
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: { patient_id: string; amount: number; due_date: string; description: string; }) => {
      if (!payment?.id) throw new Error('Payment ID not found');
      
      const paymentData = {
        ...data,
        status: (isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        guardian_name: isGuardianPayer ? guardianName : null,
      };

      const { data: result, error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', payment.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança atualizada com sucesso!');
      onSave?.();
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error('Erro ao atualizar cobrança');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.amount || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Convert amount to number
    const numericAmount = parseFloat(formData.amount.replace(/[^\d,.-]/g, '').replace(',', '.'));

    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Valor deve ser um número válido maior que zero');
      return;
    }

    const submitData = {
      patient_id: formData.patient_id,
      amount: numericAmount,
      due_date: formData.due_date,
      description: formData.description,
    };

    if (payment) {
      updatePaymentMutation.mutate(submitData);
    } else {
      createPaymentMutation.mutate(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PatientAndPayer
        patients={patients}
        formData={formData}
        setFormData={setFormData}
        paymentTitular="patient"
        setPaymentTitular={() => {}}
        payerCpf=""
        setPayerCpf={() => {}}
        errors={{}}
        validateCpf={() => true}
      />

      <div className="space-y-2">
        <Label htmlFor="amount">Valor *</Label>
        <CurrencyInput
          value={formData.amount}
          onChange={(value) => setFormData(prev => ({ ...prev, amount: value || '' }))}
          placeholder="R$ 0,00"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">Data de Vencimento *</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição da cobrança..."
          className="w-full"
        />
      </div>

      <ReceivedCheckbox
        isAlreadyReceived={isReceived}
        setIsAlreadyReceived={setIsReceived}
        receivedDate=""
        setReceivedDate={() => {}}
        errors={{}}
      />

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}
          className="flex-1"
        >
          {createPaymentMutation.isPending || updatePaymentMutation.isPending 
            ? 'Salvando...' 
            : payment ? 'Atualizar' : 'Criar Cobrança'
          }
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
