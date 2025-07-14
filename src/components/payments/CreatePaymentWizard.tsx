
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

export function CreatePaymentWizard({ isOpen, onClose, onSuccess, patients, paymentToEdit }: CreatePaymentWizardProps) {
  const {
    currentStep,
    setCurrentStep,
    formData,
    updateFormData,
    resetWizard,
    isEditMode
  } = useCreatePaymentWizard({ paymentToEdit, patients, isOpen });

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <WizardHeader
          currentStep={getDisplayStepNumber(currentStep, formData, isEditMode)}
          totalSteps={getDisplayTotalSteps(formData, isEditMode)}
          stepTitle={getCurrentStepTitle(currentStep, formData, isEditMode)}
          title={isEditMode ? 'Editar Cobrança' : 'Nova Cobrança'}
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
      </DialogContent>
    </Dialog>
  );
}
