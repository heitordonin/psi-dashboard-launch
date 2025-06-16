
import React from 'react';
import { Button } from '@/components/ui/button';
import { Step1_Choice } from './Step1_Choice';
import { Step2_PersonalData } from './Step2_PersonalData';
import { Step3_Address } from './Step3_Address';
import { Step4_Options } from './Step4_Options';
import { Step5_Summary } from './Step5_Summary';
import { PatientWizardData } from './types';
import { Patient } from '@/types/patient';

interface WizardStepRendererProps {
  isEditMode: boolean;
  currentStep: number;
  wizardType: 'manual' | 'invite' | null;
  formData: PatientWizardData;
  updateFormData: (updates: Partial<PatientWizardData>) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleChoiceSelection: (type: 'manual' | 'invite') => void;
  onClose: () => void;
  patientToEdit?: Patient | null;
}

export const WizardStepRenderer = ({
  isEditMode,
  currentStep,
  wizardType,
  formData,
  updateFormData,
  handleNext,
  handlePrevious,
  handleChoiceSelection,
  onClose,
  patientToEdit
}: WizardStepRendererProps) => {
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
