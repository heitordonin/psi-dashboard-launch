import React from 'react';
import { ValidationStates } from '@/components/patients/public/ValidationStates';
import { CadastroPacienteForm } from '@/components/patients/public/CadastroPacienteForm';
import { useCadastroPacienteWizard } from '@/hooks/useCadastroPacienteWizard';

const CadastroPaciente = () => {
  const {
    validationState,
    currentStep,
    totalSteps,
    progress,
    formData,
    isSubmitting,
    ownerEmail,
    handleNext,
    handlePrevious,
    updateFormData,
    handleFinalSubmit,
  } = useCadastroPacienteWizard();

  if (validationState !== 'valid') {
    return <ValidationStates state={validationState} />;
  }

  return (
    <CadastroPacienteForm
      currentStep={currentStep}
      totalSteps={totalSteps}
      progress={progress}
      formData={formData}
      isSubmitting={isSubmitting}
      ownerEmail={ownerEmail}
      onNext={handleNext}
      onPrevious={handlePrevious}
      updateFormData={updateFormData}
      onFinalSubmit={handleFinalSubmit}
    />
  );
};

export default CadastroPaciente;
