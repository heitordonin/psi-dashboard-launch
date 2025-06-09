import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { validateCpf, validateCnpj } from '@/utils/validators';
import { Patient } from '@/types/patient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PatientFormData {
  full_name: string;
  patient_type: "individual" | "company";
  cpf: string;
  cnpj: string;
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
    patient_type: patient?.patient_type || 'individual',
    cpf: patient?.cpf || '',
    cnpj: patient?.cnpj || '',
    email: patient?.email || '',
    phone: patient?.phone || '',
    has_financial_guardian: patient?.has_financial_guardian || false,
    guardian_cpf: patient?.guardian_cpf || '',
    is_payment_from_abroad: patient?.is_payment_from_abroad || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Function to check for duplicates within the same user
  const checkForDuplicates = async (data: PatientFormData): Promise<string | null> => {
    if (!user?.id) return null;

    const queries = [];

    // Check CPF duplicates for individual patients
    if (data.patient_type === 'individual' && data.cpf && !data.is_payment_from_abroad) {
      const cleanCpf = data.cpf.replace(/\D/g, '');
      queries.push(
        supabase
          .from('patients')
          .select('id')
          .eq('owner_id', user.id)
          .eq('cpf', cleanCpf)
          .neq('id', patient?.id || '')
          .limit(1)
      );
    }

    // Check CNPJ duplicates for company patients
    if (data.patient_type === 'company' && data.cnpj && !data.is_payment_from_abroad) {
      const cleanCnpj = data.cnpj.replace(/\D/g, '');
      queries.push(
        supabase
          .from('patients')
          .select('id')
          .eq('owner_id', user.id)
          .eq('cnpj', cleanCnpj)
          .neq('id', patient?.id || '')
          .limit(1)
      );
    }

    // Check email duplicates
    if (data.email) {
      queries.push(
        supabase
          .from('patients')
          .select('id')
          .eq('owner_id', user.id)
          .eq('email', data.email.trim())
          .neq('id', patient?.id || '')
          .limit(1)
      );
    }

    try {
      const results = await Promise.all(queries);
      
      let duplicateIndex = 0;
      
      // Check CPF duplicate
      if (data.patient_type === 'individual' && data.cpf && !data.is_payment_from_abroad) {
        const { data: cpfResult, error } = results[duplicateIndex];
        if (error) throw error;
        if (cpfResult && cpfResult.length > 0) {
          return 'Já existe um paciente cadastrado com este CPF na sua conta.';
        }
        duplicateIndex++;
      }

      // Check CNPJ duplicate
      if (data.patient_type === 'company' && data.cnpj && !data.is_payment_from_abroad) {
        const { data: cnpjResult, error } = results[duplicateIndex];
        if (error) throw error;
        if (cnpjResult && cnpjResult.length > 0) {
          return 'Já existe um paciente cadastrado com este CNPJ na sua conta.';
        }
        duplicateIndex++;
      }

      // Check email duplicate
      if (data.email) {
        const { data: emailResult, error } = results[duplicateIndex];
        if (error) throw error;
        if (emailResult && emailResult.length > 0) {
          return 'Já existe um paciente cadastrado com este email na sua conta.';
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return 'Erro ao verificar duplicatas. Tente novamente.';
    }
  };

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Check for duplicates before creating
      const duplicateError = await checkForDuplicates(data);
      if (duplicateError) {
        throw new Error(duplicateError);
      }
      
      // Build the patient data object with only the relevant fields
      const patientData: any = {
        full_name: data.full_name.trim(),
        patient_type: data.patient_type,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        has_financial_guardian: data.has_financial_guardian,
        is_payment_from_abroad: data.is_payment_from_abroad,
        owner_id: user.id
      };
      
      // Clean and include only relevant document field
      if (data.patient_type === 'individual') {
        patientData.cpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
        patientData.cnpj = null;
      } else {
        patientData.cpf = null;
        patientData.cnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null;
      }
      
      // Clean guardian CPF if present
      if (data.has_financial_guardian && data.guardian_cpf) {
        patientData.guardian_cpf = data.guardian_cpf.replace(/\D/g, '');
      } else {
        patientData.guardian_cpf = null;
      }

      const { error } = await supabase
        .from('patients')
        .insert(patientData);
      
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
      toast.error(error.message || 'Erro ao criar paciente');
    }
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      if (!patient?.id) throw new Error('Patient ID is required for update');
      
      // Check for duplicates before updating
      const duplicateError = await checkForDuplicates(data);
      if (duplicateError) {
        throw new Error(duplicateError);
      }
      
      // Build the patient data object with properly cleaned fields
      const patientData: any = {
        full_name: data.full_name.trim(),
        patient_type: data.patient_type,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        has_financial_guardian: data.has_financial_guardian,
        is_payment_from_abroad: data.is_payment_from_abroad,
      };
      
      // Clean and include only relevant document field
      if (data.patient_type === 'individual') {
        patientData.cpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
        patientData.cnpj = null;
      } else {
        patientData.cpf = null;
        patientData.cnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null;
      }
      
      // Clean guardian CPF if present
      if (data.has_financial_guardian && data.guardian_cpf) {
        patientData.guardian_cpf = data.guardian_cpf.replace(/\D/g, '');
      } else {
        patientData.guardian_cpf = null;
      }
      
      const { error } = await supabase
        .from('patients')
        .update(patientData)
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
      toast.error(error.message || 'Erro ao atualizar paciente');
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

  const formatCnpj = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 14) {
      return numericValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2');
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

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCnpj = formatCnpj(e.target.value);
    setFormData(prev => ({ ...prev, cnpj: formattedCnpj }));
  };

  const handleGuardianCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    setFormData(prev => ({ ...prev, guardian_cpf: formattedCpf }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
  };

  const handlePatientTypeChange = (isCompany: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      patient_type: isCompany ? 'company' : 'individual',
      cpf: isCompany ? '' : prev.cpf,
      cnpj: isCompany ? prev.cnpj : ''
    }));
    
    // Clear related errors when switching types
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cpf;
      delete newErrors.cnpj;
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }

    // Document validation based on type and payment origin
    if (!formData.is_payment_from_abroad) {
      if (formData.patient_type === 'individual') {
        if (!formData.cpf) {
          newErrors.cpf = 'CPF é obrigatório para pessoa física';
        } else if (!validateCpf(formData.cpf)) {
          newErrors.cpf = 'CPF deve ter um formato válido';
        }
      } else {
        if (!formData.cnpj) {
          newErrors.cnpj = 'CNPJ é obrigatório para empresa';
        } else if (!validateCnpj(formData.cnpj)) {
          newErrors.cnpj = 'CNPJ deve ter um formato válido';
        }
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

  // Clear document errors when payment from abroad changes
  useEffect(() => {
    if (formData.is_payment_from_abroad && (errors.cpf || errors.cnpj)) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.cpf;
        delete newErrors.cnpj;
        return newErrors;
      });
    }
  }, [formData.is_payment_from_abroad, errors.cpf, errors.cnpj]);

  const isLoading = createPatientMutation.isPending || updatePatientMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Nome Completo *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="Nome completo do paciente/empresa"
          className={errors.full_name ? 'border-red-500' : ''}
        />
        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tipo de Cadastro</Label>
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${formData.patient_type === 'individual' ? 'font-medium' : 'text-gray-500'}`}>
              Pessoa Física
            </span>
            <Switch
              checked={formData.patient_type === 'company'}
              onCheckedChange={handlePatientTypeChange}
            />
            <span className={`text-sm ${formData.patient_type === 'company' ? 'font-medium' : 'text-gray-500'}`}>
              Empresa
            </span>
          </div>
        </div>
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

      {formData.patient_type === 'individual' && (
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
      )}

      {formData.patient_type === 'company' && (
        <div>
          <Label htmlFor="cnpj">
            CNPJ {!formData.is_payment_from_abroad && '*'}
          </Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={handleCnpjChange}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            className={errors.cnpj ? 'border-red-500' : ''}
            disabled={formData.is_payment_from_abroad}
          />
          {errors.cnpj && <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>}
          {formData.is_payment_from_abroad && (
            <p className="text-sm text-gray-500 mt-1">CNPJ não é obrigatório para pagamentos do exterior</p>
          )}
        </div>
      )}

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
