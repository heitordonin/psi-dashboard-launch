
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Payment } from "@/types/payment";
import { DescriptionAutocomplete } from "./DescriptionAutocomplete";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";

interface Patient {
  id: string;
  full_name: string;
  guardian_cpf?: string;
}

interface PaymentFormProps {
  payment?: Payment;
  onClose: () => void;
}

export const PaymentForm = ({ payment, onClose }: PaymentFormProps) => {
  const [formData, setFormData] = useState({
    patient_id: payment?.patient_id || '',
    amount: payment?.amount || '',
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

  // Atualizar payer_cpf quando o paciente ou titular mudar
  const handlePatientChange = (patientId: string) => {
    setFormData({ ...formData, patient_id: patientId });
    const patient = patients.find(p => p.id === patientId);
    
    if (patient?.guardian_cpf && paymentTitular === 'other') {
      setPayerCpf(patient.guardian_cpf);
    } else if (paymentTitular === 'other' && !patient?.guardian_cpf) {
      setPayerCpf('');
    }
  };

  const handleTitularChange = (value: 'patient' | 'other') => {
    setPaymentTitular(value);
    if (value === 'patient') {
      setPayerCpf('');
    } else if (value === 'other') {
      const selectedPatient = patients.find(p => p.id === formData.patient_id);
      if (selectedPatient?.guardian_cpf) {
        setPayerCpf(selectedPatient.guardian_cpf);
      }
    }
  };

  const validateCpf = (cpf: string) => {
    // Remove caracteres não numéricos
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    // Validação do dígito verificador
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

  const formatCpf = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

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

    if (isAlreadyReceived && !receivedDate) {
      newErrors.receivedDate = 'Data do recebimento é obrigatória quando valor já foi recebido';
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
      <div>
        <Label htmlFor="patient_id">Paciente *</Label>
        <Select
          value={formData.patient_id}
          onValueChange={handlePatientChange}
        >
          <SelectTrigger className={errors.patient_id ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecione um paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.patient_id && <p className="text-red-500 text-sm mt-1">{errors.patient_id}</p>}
      </div>

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

      <div>
        <Label>Quem é o titular do pagamento? *</Label>
        <RadioGroup
          value={paymentTitular}
          onValueChange={handleTitularChange}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="patient" id="patient" />
            <Label htmlFor="patient">Paciente</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="other" id="other" />
            <Label htmlFor="other">Outro CPF</Label>
          </div>
        </RadioGroup>
      </div>

      {paymentTitular === 'other' && (
        <div>
          <Label htmlFor="payer_cpf">CPF do Titular *</Label>
          <Input
            id="payer_cpf"
            type="text"
            value={formatCpf(payerCpf)}
            onChange={(e) => setPayerCpf(e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
            className={errors.payerCpf ? 'border-red-500' : ''}
          />
          {errors.payerCpf && <p className="text-red-500 text-sm mt-1">{errors.payerCpf}</p>}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="already-received"
            checked={isAlreadyReceived}
            onCheckedChange={(checked) => setIsAlreadyReceived(checked === true)}
          />
          <Label htmlFor="already-received">Valor já recebido?</Label>
        </div>

        {isAlreadyReceived && (
          <div>
            <Label htmlFor="received_date">Data do Recebimento *</Label>
            <Input
              id="received_date"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className={errors.receivedDate ? 'border-red-500' : ''}
            />
            {errors.receivedDate && <p className="text-red-500 text-sm mt-1">{errors.receivedDate}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {payment ? 'Atualizar' : 'Criar'} Cobrança
        </Button>
      </div>
    </form>
  );
};
