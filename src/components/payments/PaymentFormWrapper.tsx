import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PatientAndPayer } from './PatientAndPayer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ReceivedCheckbox } from './ReceivedCheckbox';
import { DefaultDescriptionModal } from '@/components/DefaultDescriptionModal';
import { InvoiceDescriptionsManager } from '@/components/InvoiceDescriptionsManager';
import { FileText } from 'lucide-react';
import type { Payment } from '@/types/payment';

interface FormData {
  patient_id: string;
  amount: number;
  due_date: string;
  description: string;
  payer_cpf: string;
}

interface PaymentFormWrapperProps {
  payment?: Payment;
  onSave?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function PaymentFormWrapper({ payment, onSave, onCancel, onClose }: PaymentFormWrapperProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    patient_id: payment?.patient_id || '',
    amount: payment?.amount || 0,
    due_date: payment?.due_date || '',
    description: payment?.description || '',
    payer_cpf: payment?.payer_cpf || '',
  });

  const [isReceived, setIsReceived] = useState(payment?.status === 'paid');
  const [receivedDate, setReceivedDate] = useState(payment?.paid_date || '');
  const [paymentTitular, setPaymentTitular] = useState<'patient' | 'other'>(
    payment?.payer_cpf ? 'other' : 'patient'
  );
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showDescriptionManager, setShowDescriptionManager] = useState(false);

  // Initialize received date when isReceived changes to true
  useEffect(() => {
    if (isReceived && !receivedDate) {
      const today = new Date().toISOString().split('T')[0];
      setReceivedDate(today);
    }
  }, [isReceived, receivedDate]);

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

  const validateCpf = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, '');
    return cleanCpf.length === 11;
  };

  const createPaymentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const paymentData = {
        patient_id: data.patient_id,
        amount: data.amount,
        due_date: isReceived ? (data.due_date || receivedDate) : data.due_date,
        description: data.description,
        owner_id: user.id,
        status: (isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: isReceived ? receivedDate : null,
        payer_cpf: paymentTitular === 'other' ? data.payer_cpf : null,
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
    mutationFn: async (data: FormData) => {
      if (!payment?.id) throw new Error('Payment ID not found');
      
      const paymentData = {
        patient_id: data.patient_id,
        amount: data.amount,
        due_date: data.due_date,
        description: data.description,
        status: (isReceived ? 'paid' : 'pending') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: isReceived ? receivedDate : null,
        payer_cpf: paymentTitular === 'other' ? data.payer_cpf : null,
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

  const handleSelectDescription = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
    setShowDescriptionModal(false);
  };

  const handleManageDescriptions = () => {
    setShowDescriptionModal(false);
    setShowDescriptionManager(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!formData.patient_id || !formData.amount) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
  
    if (isNaN(formData.amount) || formData.amount <= 0) {
      toast.error('Valor deve ser um número válido maior que zero');
      return;
    }

    // Validate received date if payment is marked as received
    if (isReceived && !receivedDate) {
      toast.error('Data de recebimento é obrigatória');
      return;
    }

    // Validate due date if payment is not received
    if (!isReceived && !formData.due_date) {
      toast.error('Data de vencimento é obrigatória');
      return;
    }

    // Validate CPF if payment titular is different
    if (paymentTitular === 'other' && !validateCpf(formData.payer_cpf)) {
      toast.error('CPF do titular é obrigatório e deve ser válido');
      return;
    }

    const submitData: FormData = {
      patient_id: formData.patient_id,
      amount: formData.amount,
      due_date: isReceived ? (formData.due_date || receivedDate) : formData.due_date,
      description: formData.description,
      payer_cpf: formData.payer_cpf,
    };
  
    if (payment) {
      updatePaymentMutation.mutate(submitData);
    } else {
      createPaymentMutation.mutate(submitData);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <PatientAndPayer
          patients={patients}
          formData={formData}
          setFormData={setFormData}
          paymentTitular={paymentTitular}
          setPaymentTitular={setPaymentTitular}
          payerCpf={formData.payer_cpf}
          setPayerCpf={(cpf) => setFormData(prev => ({ ...prev, payer_cpf: cpf }))}
          errors={{}}
          validateCpf={validateCpf}
        />

        <ReceivedCheckbox
          isAlreadyReceived={isReceived}
          setIsAlreadyReceived={setIsReceived}
          receivedDate={receivedDate}
          setReceivedDate={setReceivedDate}
          errors={{}}
          isEditing={!!payment}
        />
        
        {!isReceived && (
          <div className="space-y-2">
            <Label htmlFor="due_date">Data de Vencimento *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, due_date: e.target.value }))
              }
              className="w-full"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="amount">Valor *</Label>
          <CurrencyInput
            value={formData.amount}
            onChange={(value) => {
              console.log('Currency input changed:', value);
              setFormData(prev => ({ ...prev, amount: value }));
            }}
            placeholder="R$ 0,00"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Descrição</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDescriptionModal(true)}
              className="text-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              Usar Descrição Padrão
            </Button>
          </div>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição da cobrança..."
            className="w-full"
          />
        </div>

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

      <DefaultDescriptionModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        onSelectDescription={handleSelectDescription}
        onManageDescriptions={handleManageDescriptions}
      />

      <InvoiceDescriptionsManager
        isOpen={showDescriptionManager}
        onClose={() => setShowDescriptionManager(false)}
      />
    </>
  );
}
