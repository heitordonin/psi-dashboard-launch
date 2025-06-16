
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import { Step1_Choice } from './wizard/Step1_Choice';
import { Step2_PersonalData } from './wizard/Step2_PersonalData';
import { Step3_Address } from './wizard/Step3_Address';
import { Step4_Options } from './wizard/Step4_Options';
import { Step5_Summary } from './wizard/Step5_Summary';
import { Patient } from '@/types/patient';

interface PatientWizardData {
  // Personal data
  full_name: string;
  patient_type: "individual" | "company";
  cpf: string;
  cnpj: string;
  email: string;
  phone: string;
  
  // Address data
  zip_code: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  
  // Options
  has_financial_guardian: boolean;
  guardian_cpf: string;
  is_payment_from_abroad: boolean;
}

interface CreatePatientWizardProps {
  onClose: () => void;
  patientToEdit?: Patient | null;
}

export const CreatePatientWizard = ({ onClose, patientToEdit }: CreatePatientWizardProps) => {
  const isEditMode = !!patientToEdit;
  const [currentStep, setCurrentStep] = useState(isEditMode ? 1 : 1); // Always start at step 1, but we'll adjust logic below
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
        zip_code: '',
        street: '',
        street_number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
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

  const renderStep = () => {
    // For edit mode, skip the choice step and start directly with personal data
    if (isEditMode) {
      switch (currentStep) {
        case 1:
          return (
            <Step2_PersonalData
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isEditMode={isEditMode}
            />
          );
        case 2:
          return (
            <Step3_Address
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        case 3:
          return (
            <Step4_Options
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        case 4:
          return (
            <Step5_Summary
              formData={formData}
              onPrevious={handlePrevious}
              onClose={onClose}
              patientToEdit={patientToEdit}
            />
          );
        default:
          return null;
      }
    }

    // For creation mode, include the choice step
    if (currentStep === 1 && !isEditMode) {
      return <Step1_Choice onNext={handleNext} onChoiceSelect={handleChoiceSelection} />;
    }

    if (wizardType === 'invite') {
      // Placeholder for invite flow
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold mb-2">Envio de Link</h3>
          <p className="text-gray-600 mb-4">Esta funcionalidade estará disponível em breve.</p>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      );
    }

    // Manual entry flow for creation
    switch (currentStep) {
      case 2:
        return (
          <Step2_PersonalData
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isEditMode={isEditMode}
          />
        );
      case 3:
        return (
          <Step3_Address
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <Step4_Options
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <Step5_Summary
            formData={formData}
            onPrevious={handlePrevious}
            onClose={onClose}
            patientToEdit={patientToEdit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <CardTitle className="text-xl">
              {isEditMode ? 'Editar Paciente' : 'Novo Paciente'}
            </CardTitle>
            <div className="mt-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-500 mt-1">
                Passo {currentStep} de {totalSteps}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};
