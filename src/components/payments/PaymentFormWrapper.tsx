
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Payment } from "@/types/payment";
import { PatientAndPayer } from "./PatientAndPayer";
import { GuardianToggle } from "./GuardianToggle";
import { ReceivedCheckbox } from "./ReceivedCheckbox";
import { PaymentButtons } from "./PaymentButtons";
import { DescriptionAutocomplete } from "../DescriptionAutocomplete";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Patient {
  id: string;
  full_name: string;
  guardian_cpf?: string;
}

interface PaymentFormWrapperProps {
  payment?: Payment;
  onClose: () => void;
}

export const PaymentFormWrapper = ({ payment, onClose }: PaymentFormWrapperProps) => {
  const [formData, setFormData] = useState({
    patient_id: payment?.patient_id || '',
    amount: payment?.amount?.toString() || '',
    due_date: payment?.due_date || '',
    description: payment?.description || ''
  });
  const [isAlreadyReceived, setIsAlreadyReceived] = useState(payment?.status === 'paid');
  const [receivedDate, setReceivedDate] = useState(payment?.paid_date || '');
  const [paymentTitular, setPaymentTitular] = useState<'patient' | 'other'>('patient');
  const [payerCpf, setPayerCpf] = useState(payment?.payer_cpf || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();
  
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      console.log('Buscando pacientes...');
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, guardian_cpf')
        .order('full_name');
      if (error) {
        console.error('Erro ao buscar pacientes:', error);
        throw error;
      }
      console.log('Pacientes encontrados:', data);
      return data as Patient[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: { 
      patient_id: string; 
      amount: number; 
      due_date: string; 
      status: 'draft' | 'pending' | 'paid' | 'failed';
      paid_date?: string | null;
      payer_cpf?: string | null;
      description?: string | null;
    }) => {
      console.log('Criando cobrança com dados:', data);
      const { error } = await supabase.from('payments').insert(data);
      if (error) {
        console.error('Erro ao criar cobrança:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança criada com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro na mutação de criação:', error);
      toast.error('Erro ao criar cobrança: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { 
      patient_id: string; 
      amount: number; 
      due_date: string; 
      status: 'draft' | 'pending' | 'paid' | 'failed';
      paid_date?: string | null;
      payer_cpf?: string | null;
      description?: string | null;
    }) => {
      console.log('Atualizando cobrança com dados:', data);
      const { error } = await supabase
        .from('payments')
        .update(data)
        .eq('id', payment!.id);
      if (error) {
        console.error('Erro ao atualizar cobrança:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança atualizada com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro na mutação de atualização:', error);
      toast.error('Erro ao atualizar cobrança: ' + error.message);
    }
  });

  const validateCpf = (cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf[i]) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCpf[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf[i]) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCpf[10])) return false;
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.patient_id) {
      newErrors.patient_id = 'Paciente é obrigatório';
    }
    
    if (!formData.amount || Number(formData.amount) < 1) {
      newErrors.amount = 'Valor deve ser maior que R$ 1,00';
    }
    
    if (!formData.due_date) {
      newErrors.due_date = 'Data de vencimento é obrigatória';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.due_date < today) {
        newErrors.due_date = 'Data de vencimento deve ser hoje ou no futuro';
      }
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (paymentTitular === 'other') {
      if (!payerCpf.trim()) {
        newErrors.payerCpf = 'CPF do titular é obrigatório';
      } else if (!validateCpf(payerCpf)) {
        newErrors.payerCpf = 'CPF inválido';
      }
    }

    if (isAlreadyReceived) {
      if (!receivedDate) {
        newErrors.receivedDate = 'Data do recebimento é obrigatória quando valor já foi recebido';
      } else {
        const today = new Date().toISOString().split('T')[0];
        if (receivedDate > today) {
          newErrors.receivedDate = 'Data do recebimento não pode ser maior que hoje';
        }
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const paymentData = {
        patient_id: formData.patient_id,
        amount: Number(formData.amount),
        due_date: formData.due_date,
        status: (isAlreadyReceived ? 'paid' : 'draft') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: isAlreadyReceived ? receivedDate : null,
        payer_cpf: paymentTitular === 'other' ? payerCpf.replace(/\D/g, '') : null,
        description: formData.description?.trim() || null
      };
      
      console.log('Enviando dados do pagamento:', paymentData);
      
      if (payment) {
        updateMutation.mutate(paymentData);
      } else {
        createMutation.mutate(paymentData);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PatientAndPayer
        patients={patients}
        formData={formData}
        setFormData={setFormData}
        paymentTitular={paymentTitular}
        setPaymentTitular={setPaymentTitular}
        payerCpf={payerCpf}
        setPayerCpf={setPayerCpf}
        errors={errors}
        validateCpf={validateCpf}
      />

      <div>
        <Label htmlFor="amount">Valor *</Label>
        <CurrencyInput
          value={formData.amount}
          onChange={(value) => setFormData({ ...formData, amount: value.toString() })}
          className={errors.amount ? 'border-red-500' : ''}
        />
        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
      </div>

      <div>
        <Label htmlFor="due_date">Data de Vencimento *</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          className={errors.due_date ? 'border-red-500' : ''}
        />
        {errors.due_date && <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>}
      </div>

      <DescriptionAutocomplete
        value={formData.description}
        onChange={(value) => setFormData({ ...formData, description: value })}
        error={errors.description}
      />

      <ReceivedCheckbox
        isAlreadyReceived={isAlreadyReceived}
        setIsAlreadyReceived={setIsAlreadyReceived}
        receivedDate={receivedDate}
        setReceivedDate={setReceivedDate}
        errors={errors}
      />

      <PaymentButtons
        onClose={onClose}
        isLoading={createMutation.isPending || updateMutation.isPending}
        isEditing={!!payment}
      />
    </form>
  );
};

export default PaymentFormWrapper;
