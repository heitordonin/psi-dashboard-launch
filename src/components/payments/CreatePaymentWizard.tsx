
import { WizardHeader } from './wizard/WizardHeader';
import { WizardStepRenderer } from './wizard/WizardStepRenderer';
import { WizardNavigation } from './wizard/WizardNavigation';
import { useCreatePaymentWizard } from './wizard/useCreatePaymentWizard';
import { 
  getTotalSteps, 
  getNextStep, 
  getPreviousStep, 
  getCurrentStepTitle, 
  getDisplayStepNumber, 
  getDisplayTotalSteps 
} from './wizard/wizardStepUtils';
import { isNextDisabled } from './wizard/wizardValidation';
import type { CreatePaymentWizardProps } from './wizard/types';

export function CreatePaymentWizard({ isOpen, onClose, onSuccess, patients, paymentToEdit, preSelectedPatientId }: CreatePaymentWizardProps) {
  const {
    currentStep,
    setCurrentStep,
    formData,
    updateFormData,
    resetWizard,
    isEditMode
  } = useCreatePaymentWizard({ paymentToEdit, patients, isOpen, preSelectedPatientId });

  const nextStep = () => {
    const nextStepNumber = getNextStep(currentStep, formData);
    if (nextStepNumber !== currentStep) {
      setCurrentStep(nextStepNumber);
    }
  };

  const prevStep = () => {
    const prevStepNumber = getPreviousStep(currentStep, formData, isEditMode);
    if (prevStepNumber !== currentStep) {
      setCurrentStep(prevStepNumber);
    }
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <WizardHeader
          currentStep={getDisplayStepNumber(currentStep, formData, isEditMode)}
          totalSteps={getDisplayTotalSteps(formData, isEditMode)}
          stepTitle={getCurrentStepTitle(currentStep, formData, isEditMode)}
          title={isEditMode ? 'Editar Cobrança' : 'Nova Cobrança'}
          onClose={handleClose}
        />

        <div className="py-6 px-6 overflow-y-auto flex-1 mobile-form-spacing">
          <WizardStepRenderer
            currentStep={currentStep}
            formData={formData}
            updateFormData={updateFormData}
            patients={patients}
            onNext={nextStep}
            onPrevious={prevStep}
            onSuccess={onSuccess}
            onClose={handleClose}
            paymentToEdit={paymentToEdit}
          />
        </div>

        <div className="px-6 pb-6">
          <WizardNavigation
            currentStep={currentStep}
            totalSteps={getTotalSteps()}
            onPrevious={prevStep}
            onNext={nextStep}
            isNextDisabled={isNextDisabled(currentStep, formData, patients)}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
}
