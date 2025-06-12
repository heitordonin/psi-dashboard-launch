
import React, { useState, useEffect } from 'react';
import { Patient } from '@/types/patient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePatientMutations } from '@/hooks/usePatientMutations';
import { validatePatientForm } from '@/utils/patientFormValidation';
import { PersonalInfoFields } from '@/components/patients/form/PersonalInfoFields';
import { GuardianFields } from '@/components/patients/form/GuardianFields';
import { PatientFormActions } from '@/components/patients/form/PatientFormActions';

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

  const handlePatientTypeChange = (type: 'individual' | 'company') => {
    setFormData(prev => ({ 
      ...prev, 
      patient_type: type,
      cpf: type === 'company' ? '' : prev.cpf,
      cnpj: type === 'company' ? prev.cnpj : ''
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
      <PersonalInfoFields
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        onPatientTypeChange={handlePatientTypeChange}
      />
      
      <GuardianFields
        formData={formData}
        setFormData={setFormData}
        errors={errors}
      />

      <PatientFormActions
        onClose={onClose}
        isLoading={isLoading}
      />
    </form>
  );
};
