
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { validatePatientForm } from '@/utils/patientFormValidation';
import { formatCpf, formatCnpj, formatPhone } from '@/utils/inputFormatters';

interface PatientWizardData {
  full_name: string;
  patient_type: "individual" | "company";
  cpf: string;
  cnpj: string;
  email: string;
  phone: string;
  has_financial_guardian: boolean;
  guardian_cpf: string;
  is_payment_from_abroad: boolean;
  [key: string]: any;
}

interface Step2_PersonalDataProps {
  formData: PatientWizardData;
  updateFormData: (updates: Partial<PatientWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const Step2_PersonalData = ({ 
  formData, 
  updateFormData, 
  onNext, 
  onPrevious 
}: Step2_PersonalDataProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    updateFormData({ cpf: formattedCpf });
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCnpj = formatCnpj(e.target.value);
    updateFormData({ cnpj: formattedCnpj });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    updateFormData({ phone: formattedPhone });
  };

  const handlePatientTypeChange = (isCompany: boolean) => {
    updateFormData({ 
      patient_type: isCompany ? 'company' : 'individual',
      cpf: isCompany ? '' : formData.cpf,
      cnpj: isCompany ? formData.cnpj : ''
    });
    
    // Clear related errors when switching types
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cpf;
      delete newErrors.cnpj;
      return newErrors;
    });
  };

  const handleNext = () => {
    const validationErrors = validatePatientForm(formData);
    
    // Filter errors relevant to this step
    const stepErrors: Record<string, string> = {};
    ['full_name', 'cpf', 'cnpj', 'email'].forEach(field => {
      if (validationErrors[field]) {
        stepErrors[field] = validationErrors[field];
      }
    });

    setErrors(stepErrors);
    
    if (Object.keys(stepErrors).length === 0) {
      onNext();
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
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Dados Pessoais</h3>
        <p className="text-gray-600">Preencha as informações básicas do paciente</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateFormData({ full_name: e.target.value })}
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
            onCheckedChange={(checked) => updateFormData({ 
              is_payment_from_abroad: !!checked 
            })}
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
            onChange={(e) => updateFormData({ email: e.target.value })}
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
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Voltar
        </Button>
        <Button type="button" onClick={handleNext}>
          Próximo
        </Button>
      </div>
    </div>
  );
};
