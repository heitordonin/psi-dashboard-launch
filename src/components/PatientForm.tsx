import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Patient } from "@/types/patient";
import { useAuth } from "@/contexts/SupabaseAuthContext";

interface PatientFormProps {
  patient?: Patient;
  onClose: () => void;
}

export const PatientForm = ({ patient, onClose }: PatientFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: patient?.full_name || '',
    cpf: patient?.cpf || '',
    email: patient?.email || '',
    phone: patient?.phone || '',
    has_financial_guardian: patient?.has_financial_guardian || false,
    guardian_cpf: patient?.guardian_cpf || '',
    is_payment_from_abroad: patient?.is_payment_from_abroad || false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();

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

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 10) {
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Criando paciente:', data);
      const { error } = await supabase.from('patients').insert({
        ...data,
        owner_id: user?.id
      });
      if (error) {
        console.error('Erro ao criar paciente:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente criado com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro na criação:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        toast.error('Este CPF já está cadastrado!');
      } else {
        toast.error('Erro ao criar paciente: ' + error.message);
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Atualizando paciente:', data);
      const { error } = await supabase
        .from('patients')
        .update(data)
        .eq('id', patient!.id);
      if (error) {
        console.error('Erro ao atualizar paciente:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente atualizado com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro na atualização:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        toast.error('Este CPF já está cadastrado!');
      } else {
        toast.error('Erro ao atualizar paciente: ' + error.message);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }
    
    // CPF is only required if payment is NOT from abroad
    if (!formData.is_payment_from_abroad) {
      if (!formData.cpf.trim()) {
        newErrors.cpf = 'CPF é obrigatório';
      } else if (!validateCpf(formData.cpf)) {
        newErrors.cpf = 'CPF inválido';
      }
    }

    if (formData.has_financial_guardian) {
      if (!formData.guardian_cpf.trim()) {
        newErrors.guardian_cpf = 'CPF do responsável é obrigatório';
      } else if (!validateCpf(formData.guardian_cpf)) {
        newErrors.guardian_cpf = 'CPF do responsável inválido';
      }
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const patientData = {
        full_name: formData.full_name.trim(),
        cpf: formData.is_payment_from_abroad ? null : formData.cpf.replace(/\D/g, ''),
        email: formData.email?.trim() || null,
        phone: formData.phone?.replace(/\D/g, '') || null,
        has_financial_guardian: formData.has_financial_guardian,
        guardian_cpf: formData.has_financial_guardian ? formData.guardian_cpf.replace(/\D/g, '') : null,
        is_payment_from_abroad: formData.is_payment_from_abroad
      };
      
      console.log('Enviando dados do paciente:', patientData);
      
      if (patient) {
        updateMutation.mutate(patientData);
      } else {
        createMutation.mutate(patientData);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Nome Completo *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="Digite o nome completo"
          className={errors.full_name ? 'border-red-500' : ''}
        />
        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_payment_from_abroad"
            checked={formData.is_payment_from_abroad}
            onCheckedChange={(checked) => {
              setFormData({ 
                ...formData, 
                is_payment_from_abroad: checked,
                cpf: checked ? '' : formData.cpf
              });
            }}
          />
          <Label htmlFor="is_payment_from_abroad">Pagamento vem do exterior?</Label>
        </div>
      </div>

      {!formData.is_payment_from_abroad && (
        <div>
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            value={formatCpf(formData.cpf)}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            placeholder="000.000.000-00"
            maxLength={14}
            className={errors.cpf ? 'border-red-500' : ''}
          />
          {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@exemplo.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formatPhone(formData.phone)}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(11) 99999-9999"
          maxLength={15}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-guardian"
            checked={formData.has_financial_guardian}
            onCheckedChange={(checked) => {
              setFormData({ 
                ...formData, 
                has_financial_guardian: checked === true,
                guardian_cpf: checked === true ? formData.guardian_cpf : ''
              });
            }}
          />
          <Label htmlFor="has-guardian">Possui responsável financeiro?</Label>
        </div>

        {formData.has_financial_guardian && (
          <div>
            <Label htmlFor="guardian_cpf">CPF do Responsável *</Label>
            <Input
              id="guardian_cpf"
              value={formatCpf(formData.guardian_cpf)}
              onChange={(e) => setFormData({ ...formData, guardian_cpf: e.target.value })}
              placeholder="000.000.000-00"
              maxLength={14}
              className={errors.guardian_cpf ? 'border-red-500' : ''}
            />
            {errors.guardian_cpf && <p className="text-red-500 text-sm mt-1">{errors.guardian_cpf}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {patient ? 'Atualizar' : 'Criar'} Paciente
        </Button>
      </div>
    </form>
  );
};
