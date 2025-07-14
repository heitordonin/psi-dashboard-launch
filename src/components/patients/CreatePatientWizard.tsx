
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Patient } from '@/types/patient';
import { usePatientWizard } from './wizard/usePatientWizard';
import { WizardHeader } from './wizard/WizardHeader';
import { WizardStepRenderer } from './wizard/WizardStepRenderer';

interface CreatePatientWizardProps {
  onClose: () => void;
  patientToEdit?: Patient | null;
}

export const CreatePatientWizard = ({ onClose, patientToEdit }: CreatePatientWizardProps) => {
  const {
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
  } = usePatientWizard({ patientToEdit, onClose });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 keyboard-aware">
      <Card className="w-full max-w-2xl modal-content-mobile flex flex-col">
        <WizardHeader
          isEditMode={isEditMode}
          currentStep={currentStep}
          totalSteps={totalSteps}
          progress={progress}
          onClose={onClose}
        />
        <CardContent className="flex-1 overflow-y-auto mobile-form-spacing px-6 pb-6">
          <WizardStepRenderer
            isEditMode={isEditMode}
            currentStep={currentStep}
            wizardType={wizardType}
            formData={formData}
            updateFormData={updateFormData}
            handleNext={handleNext}
            handlePrevious={handlePrevious}
            handleChoiceSelection={handleChoiceSelection}
            onClose={onClose}
            patientToEdit={patientToEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
};
