
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WizardHeader } from './WizardHeader';
import { WizardStepRenderer } from './WizardStepRenderer';
import { WizardNavigation } from './WizardNavigation';
import { useWizardState } from './useWizardState';
import type { CreatePaymentWizardProps } from './types';

const STEP_TITLES = [
  'Tipo de Cobrança',
  'Detalhes do Pagamento', 
  'Juros e Multa',
  'Dados do Pagador',
  'Resumo e Confirmação'
];

const TOTAL_STEPS = 5;

export function CreatePaymentWizard({ isOpen, onClose, onSuccess, patients }: CreatePaymentWizardProps) {
  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    resetWizard
  } = useWizardState();

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  // Determine if next button should be disabled based on current step validation
  const isNextDisabled = () => {
    switch (currentStep) {
      case 1:
        return !formData.paymentType;
      case 2:
        return !formData.amount || !formData.due_date || !formData.description;
      case 3:
        return false; // This step has no required fields
      case 4:
        return !formData.patient_id || !formData.payer_cpf;
      case 5:
        return false; // Summary step
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <WizardHeader
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          stepTitles={STEP_TITLES}
          onClose={handleClose}
        />

        <div className="py-6">
          <WizardStepRenderer
            currentStep={currentStep}
            formData={formData}
            updateFormData={updateFormData}
            patients={patients}
            onNext={nextStep}
            onPrevious={prevStep}
            onSuccess={onSuccess}
            onClose={handleClose}
          />
        </div>

        <WizardNavigation
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onPrevious={prevStep}
          onNext={nextStep}
          isNextDisabled={isNextDisabled()}
        />
      </DialogContent>
    </Dialog>
  );
}
