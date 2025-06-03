
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Payment } from "@/types/payment";
import { DescriptionAutocomplete } from "./DescriptionAutocomplete";

interface Patient {
  id: string;
  full_name: string;
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();
  
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
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
    }) => {
      const { error } = await supabase.from('payments').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança criada com sucesso!');
      onClose();
    },
    onError: (error: any) => {
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
    }) => {
      const { error } = await supabase
        .from('payments')
        .update(data)
        .eq('id', payment!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança atualizada com sucesso!');
      onClose();
    },
    onError: (error: any) => {
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

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
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
        paid_date: isAlreadyReceived ? receivedDate : null
      };
      
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
          onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
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
        <Label htmlFor="amount">Valor (R$) *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="1"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0,00"
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
