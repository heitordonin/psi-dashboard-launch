
import { useState, useEffect } from 'react';
import { Patient } from '@/types/patient';
import { PatientWizardData } from './types';

interface UsePatientWizardProps {
  patientToEdit?: Patient | null;
  onClose: () => void;
}

export const usePatientWizard = ({ patientToEdit, onClose }: UsePatientWizardProps) => {
  const isEditMode = !!patientToEdit;
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardType, setWizardType] = useState<'manual' | 'invite' | null>(isEditMode ? 'manual' : null);
  const [formData, setFormData] = useState<PatientWizardData>({
    full_name: '',
    patient_type: 'individual',
    cpf: '',
    cnpj: '',
    email: '',
    phone: '',
    zip_code: '',
    street: '',
    street_number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    has_financial_guardian: false,
    guardian_cpf: '',
    is_payment_from_abroad: false,
  });

  // Pre-fill form data when editing
  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        full_name: patientToEdit.full_name || '',
        patient_type: patientToEdit.patient_type || 'individual',
        cpf: patientToEdit.cpf || '',
        cnpj: patientToEdit.cnpj || '',
        email: patientToEdit.email || '',
        phone: patientToEdit.phone || '',
        zip_code: patientToEdit.zip_code || '',
        street: patientToEdit.street || '',
        street_number: patientToEdit.street_number || '',
        complement: patientToEdit.complement || '',
        neighborhood: patientToEdit.neighborhood || '',
        city: patientToEdit.city || '',
        state: patientToEdit.state || '',
        has_financial_guardian: patientToEdit.has_financial_guardian || false,
        guardian_cpf: patientToEdit.guardian_cpf || '',
        is_payment_from_abroad: patientToEdit.is_payment_from_abroad || false,
      });
    }
  }, [patientToEdit]);

  // Calculate total steps based on wizard type and mode
  const getTotalSteps = () => {
    if (isEditMode) return 4; // Personal Data -> Address -> Options -> Summary
    if (wizardType === 'manual') return 5; // Choice -> Personal Data -> Address -> Options -> Summary
    if (wizardType === 'invite') return 2; // Choice -> Invite Success
    return 2; // Default for choice step
  };

  const totalSteps = getTotalSteps();
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (updates: Partial<PatientWizardData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleChoiceSelection = (type: 'manual' | 'invite') => {
    setWizardType(type);
    if (type === 'manual') {
      handleNext(); // Go to personal data step
    } else {
      // Handle invite flow - for now just show a placeholder
      handleNext();
    }
  };

  return {
    isEditMode,
    currentStep,
    wizardType,
    formData,
    totalSteps,
    progress,
    handleNext,
    handlePrevious,
    updateFormData,
    handleChoiceSelection,
    setWizardType,
  };
};
