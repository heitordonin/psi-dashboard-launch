
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Patient } from '@/types/patient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePatientMutations } from '@/hooks/usePatientMutations';
import { validatePatientForm } from '@/utils/patientFormValidation';
import { formatCpf, formatCnpj, formatPhone } from '@/utils/inputFormatters';

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
  const { createPatientMutation, updatePatientMutation, isLoading } = usePatientMutations(user?.id, onClose);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validatePatientForm(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      if (patient) {
        updatePatientMutation.mutate({ data: formData, patientId: patient.id });
      } else {
        createPatientMutation.mutate(formData);
      }
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
