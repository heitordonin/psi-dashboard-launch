
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Payment } from "@/types/payment";
import { PatientAndPayer } from "./PatientAndPayer";
import { GuardianToggle } from "./GuardianToggle";
import { ReceivedCheckbox } from "./ReceivedCheckbox";
import { PaymentButtons } from "./PaymentButtons";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DefaultDescriptionModal } from "../DefaultDescriptionModal";
import { InvoiceDescriptionsManager } from "../InvoiceDescriptionsManager";
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface Patient {
  id: string;
  full_name: string;
  guardian_cpf?: string;
  is_payment_from_abroad?: boolean;
}

interface PaymentFormWrapperProps {
  payment?: Payment;
  onClose: () => void;
}

interface FormData {
  patient_id: string;
  amount: string | number;
  due_date: string;
  description: string;
}

export const PaymentFormWrapper = ({ payment, onClose }: PaymentFormWrapperProps) => {
  const [formData, setFormData] = useState<FormData>({
    patient_id: payment?.patient_id || '',
    amount: payment?.amount || 0,
    due_date: payment?.due_date || '',
    description: payment?.description || ''
  });
  const [isAlreadyReceived, setIsAlreadyReceived] = useState(payment?.status === 'paid');
  const [receivedDate, setReceivedDate] = useState(payment?.paid_date || '');
  const [paymentTitular, setPaymentTitular] = useState<'patient' | 'other'>('patient');
  const [payerCpf, setPayerCpf] = useState(payment?.payer_cpf || '');
  const [isIncomeFromAbroad, setIsIncomeFromAbroad] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDefaultDescriptions, setShowDefaultDescriptions] = useState(false);
  const [showDescriptionsManager, setShowDescriptionsManager] = useState(false);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      console.log('PaymentFormWrapper - Buscando pacientes para usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, guardian_cpf, is_payment_from_abroad')
        .order('full_name');
        
      if (error) {
        console.error('PaymentFormWrapper - Erro ao buscar pacientes:', error);
        throw error;
      }
      
      console.log('PaymentFormWrapper - Pacientes encontrados:', data);
      return data as Patient[];
    },
    enabled: !!user,
    retry: 1
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
      owner_id: string;
    }) => {
      console.log('PaymentFormWrapper - Criando cobrança com dados:', data);
      
      const { error } = await supabase.from('payments').insert(data);
      if (error) {
        console.error('PaymentFormWrapper - Erro ao criar cobrança:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança criada com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      console.error('PaymentFormWrapper - Erro na mutação de criação:', error);
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
      console.log('PaymentFormWrapper - Atualizando cobrança com dados:', data);
      
      const { error } = await supabase
        .from('payments')
        .update(data)
        .eq('id', payment!.id);
      if (error) {
        console.error('PaymentFormWrapper - Erro ao atualizar cobrança:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança atualizada com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      console.error('PaymentFormWrapper - Erro na mutação de atualização:', error);
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
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }
    
    // Parse currency value properly
    const parsedAmount = Number(
      String(formData.amount).replace(/\./g, "").replace(",", ".")
    );
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.patient_id) {
      newErrors.patient_id = 'Paciente é obrigatório';
    }
    
    if (!parsedAmount || parsedAmount < 1) {
      newErrors.amount = 'Valor deve ser maior que R$ 1,00';
    }
    
    // For received payments, we don't need a future due date
    if (!isAlreadyReceived) {
      if (!formData.due_date) {
        newErrors.due_date = 'Data de vencimento é obrigatória';
      } else {
        const today = new Date().toISOString().split('T')[0];
        if (formData.due_date < today) {
          newErrors.due_date = 'Data de vencimento deve ser hoje ou no futuro';
        }
      }
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    // Only validate CPF if income is NOT from abroad
    if (!isIncomeFromAbroad && paymentTitular === 'other') {
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
        amount: parsedAmount,
        due_date: isAlreadyReceived ? receivedDate : formData.due_date,
        status: (isAlreadyReceived ? 'paid' : 'draft') as 'draft' | 'pending' | 'paid' | 'failed',
        paid_date: isAlreadyReceived ? receivedDate : null,
        payer_cpf: (!isIncomeFromAbroad && paymentTitular === 'other') ? payerCpf.replace(/\D/g, '') : null,
        description: formData.description?.trim() || null
      };
      
      console.log('PaymentFormWrapper - Enviando dados do pagamento:', paymentData);
      
      if (payment) {
        updateMutation.mutate(paymentData);
      } else {
        createMutation.mutate({ ...paymentData, owner_id: user.id });
      }
    }
  };

  const handleSelectDescription = (description: string) => {
    setFormData({ ...formData, description });
  };

  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  return (
    <>
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

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="income_from_abroad"
              checked={isIncomeFromAbroad}
              onCheckedChange={setIsIncomeFromAbroad}
            />
            <Label htmlFor="income_from_abroad">Esta renda vem do exterior?</Label>
          </div>
        </div>

        {!isIncomeFromAbroad && !selectedPatient?.is_payment_from_abroad && (
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
            showCpfSection={true}
          />
        )}

        <ReceivedCheckbox
          isAlreadyReceived={isAlreadyReceived}
          setIsAlreadyReceived={setIsAlreadyReceived}
          receivedDate={receivedDate}
          setReceivedDate={setReceivedDate}
          errors={errors}
          isEditing={!!payment}
        />

        <div>
          <Label htmlFor="amount">Valor *</Label>
          <CurrencyInput
            value={formData.amount ?? ""}
            onChange={(value) => setFormData({ ...formData, amount: value || 0 })}
            className={errors.amount ? 'border-red-500' : ''}
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>

        {!isAlreadyReceived && (
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
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="description">Descrição *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDefaultDescriptions(true)}
            >
              Usar descrição padrão
            </Button>
          </div>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Digite a descrição da cobrança"
            className={errors.description ? 'border-red-500' : ''}
            rows={3}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        <PaymentButtons
          onClose={onClose}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isEditing={!!payment}
        />
      </form>

      <DefaultDescriptionModal
        isOpen={showDefaultDescriptions}
        onClose={() => setShowDefaultDescriptions(false)}
        onSelectDescription={handleSelectDescription}
        onManageDescriptions={() => {
          setShowDefaultDescriptions(false);
          setShowDescriptionsManager(true);
        }}
      />

      <InvoiceDescriptionsManager
        isOpen={showDescriptionsManager}
        onClose={() => setShowDescriptionsManager(false)}
      />
    </>
  );
};

export default PaymentFormWrapper;
