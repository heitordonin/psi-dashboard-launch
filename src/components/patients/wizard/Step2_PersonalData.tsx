import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePatientForm } from '@/utils/patientFormValidation';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PatientTypeSection } from './sections/PatientTypeSection';
import { DocumentSection } from './sections/DocumentSection';
import { ContactSection } from './sections/ContactSection';
import { PatientWizardData } from './types';

interface Step2_PersonalDataProps {
  formData: PatientWizardData;
  updateFormData: (updates: Partial<PatientWizardData>) => void;
  ownerEmail?: string | null;
  onNext: () => void;
  onPrevious: () => void;
  isEditMode?: boolean;
}

export const Step2_PersonalData = ({ 
  formData, 
  updateFormData, 
  ownerEmail,
  onNext, 
  onPrevious,
  isEditMode = false
}: Step2_PersonalDataProps) => {
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePatientTypeChange = (type: 'individual' | 'company') => {
    updateFormData({ 
      patient_type: type,
      cpf: type === 'company' ? '' : formData.cpf,
      cnpj: type === 'company' ? formData.cnpj : ''
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
    // Use ownerEmail for public forms, user?.email for authenticated forms
    const validationEmail = ownerEmail || user?.email;
    const validationErrors = validatePatientForm(formData, validationEmail);
    
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

        <PatientTypeSection
          patientType={formData.patient_type}
          isPaymentFromAbroad={formData.is_payment_from_abroad}
          onPatientTypeChange={(isCompany) => handlePatientTypeChange(isCompany ? 'company' : 'individual')}
          onPaymentFromAbroadChange={(checked) => updateFormData({ is_payment_from_abroad: checked })}
        />

        <DocumentSection
          patientType={formData.patient_type}
          cpf={formData.cpf}
          cnpj={formData.cnpj}
          isPaymentFromAbroad={formData.is_payment_from_abroad}
          errors={errors}
          onCpfChange={(cpf) => updateFormData({ cpf })}
          onCnpjChange={(cnpj) => updateFormData({ cnpj })}
        />

        <ContactSection
          email={formData.email}
          phone={formData.phone}
          errors={errors}
          onEmailChange={(email) => updateFormData({ email })}
          onPhoneChange={(phone) => updateFormData({ phone })}
        />
      </div>

      <div className="flex justify-between pt-4">
        {!isEditMode && (
          <Button type="button" variant="outline" onClick={onPrevious}>
            Voltar
          </Button>
        )}
        {isEditMode && <div></div>}
        <Button type="button" onClick={handleNext}>
          Próximo
        </Button>
      </div>
    </div>
  );
};
