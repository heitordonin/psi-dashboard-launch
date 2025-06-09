
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { validateCpf } from '@/utils/validators';
import { Patient } from '@/types/patient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PatientFormData {
  full_name: string;
  cpf: string;
  email: string;
  phone: string;
  has_financial_guardian: boolean;
  guardian_cpf: string;
  is_payment_from_abroad: boolean;
}

interface PatientFormProps {
  patient?: Patient;
  onClose: () => void;
}

export const PatientForm = ({ patient, onClose }: PatientFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PatientFormData>({
    full_name: patient?.full_name || '',
    cpf: patient?.cpf || '',
    email: patient?.email || '',
    phone: patient?.phone || '',
    has_financial_guardian: patient?.has_financial_guardian || false,
    guardian_cpf: patient?.guardian_cpf || '',
    is_payment_from_abroad: patient?.is_payment_from_abroad || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('patients')
        .insert({
          ...data,
          owner_id: user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-count'] });
      toast.success('Paciente criado com sucesso!');
      onClose();
    },
    onError: (error) => {
      console.error('Error creating patient:', error);
      toast.error('Erro ao criar paciente');
    }
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      if (!patient?.id) throw new Error('Patient ID is required for update');
      
      const { error } = await supabase
        .from('patients')
        .update(data)
        .eq('id', patient.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente atualizado com sucesso!');
      onClose();
    },
    onError: (error) => {
      console.error('Error updating patient:', error);
      toast.error('Erro ao atualizar paciente');
    }
  });

  const formatCpf = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 11) {
      return numericValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 11) {
      return numericValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formattedCpf }));
  };

  const handleGuardianCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    setFormData(prev => ({ ...prev, guardian_cpf: formattedCpf }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }

    // CPF validation: only required if payment is NOT from abroad
    if (!formData.is_payment_from_abroad) {
      if (!formData.cpf) {
        newErrors.cpf = 'CPF é obrigatório para pagamentos nacionais';
      } else if (!validateCpf(formData.cpf)) {
        newErrors.cpf = 'CPF deve ter um formato válido';
      }
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email deve ter um formato válido';
    }

    if (formData.has_financial_guardian) {
      if (!formData.guardian_cpf) {
        newErrors.guardian_cpf = 'CPF do responsável é obrigatório';
      } else if (!validateCpf(formData.guardian_cpf)) {
        newErrors.guardian_cpf = 'CPF do responsável deve ter um formato válido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (patient) {
      updatePatientMutation.mutate(formData);
    } else {
      createPatientMutation.mutate(formData);
    }
  };

  // Clear CPF error when payment from abroad changes
  useEffect(() => {
    if (formData.is_payment_from_abroad && errors.cpf) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.cpf;
        return newErrors;
      });
    }
  }, [formData.is_payment_from_abroad, errors.cpf]);

  const isLoading = createPatientMutation.isPending || updatePatientMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Nome Completo *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="Nome completo do paciente"
          className={errors.full_name ? 'border-red-500' : ''}
        />
        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_payment_from_abroad"
          checked={formData.is_payment_from_abroad}
          onCheckedChange={(checked) => setFormData(prev => ({ 
            ...prev, 
            is_payment_from_abroad: !!checked 
          }))}
        />
        <Label htmlFor="is_payment_from_abroad">Pagamento vem do exterior</Label>
      </div>

      <div>
        <Label htmlFor="cpf">
          CPF {!formData.is_payment_from_abroad && '*'}
        </Label>
        <Input
          id="cpf"
          value={formData.cpf}
          onChange={handleCpfChange}
          placeholder="000.000.000-00"
          maxLength={14}
          className={errors.cpf ? 'border-red-500' : ''}
          disabled={formData.is_payment_from_abroad}
        />
        {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
        {formData.is_payment_from_abroad && (
          <p className="text-sm text-gray-500 mt-1">CPF não é obrigatório para pagamentos do exterior</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="email@exemplo.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={handlePhoneChange}
          placeholder="(11) 99999-9999"
          maxLength={15}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="has_financial_guardian"
          checked={formData.has_financial_guardian}
          onCheckedChange={(checked) => setFormData(prev => ({ 
            ...prev, 
            has_financial_guardian: !!checked,
            guardian_cpf: checked ? prev.guardian_cpf : ''
          }))}
        />
        <Label htmlFor="has_financial_guardian">Tem responsável financeiro</Label>
      </div>

      {formData.has_financial_guardian && (
        <div>
          <Label htmlFor="guardian_cpf">CPF do Responsável *</Label>
          <Input
            id="guardian_cpf"
            value={formData.guardian_cpf}
            onChange={handleGuardianCpfChange}
            placeholder="000.000.000-00"
            maxLength={14}
            className={errors.guardian_cpf ? 'border-red-500' : ''}
          />
          {errors.guardian_cpf && <p className="text-red-500 text-sm mt-1">{errors.guardian_cpf}</p>}
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};
