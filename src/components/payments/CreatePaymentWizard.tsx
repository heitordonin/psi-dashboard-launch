
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WizardHeader } from './wizard/WizardHeader';
import { WizardStepRenderer } from './wizard/WizardStepRenderer';
import { WizardNavigation } from './wizard/WizardNavigation';
import { useWizardState } from './wizard/useWizardState';
import type { CreatePaymentWizardProps } from './wizard/types';

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
            onSuccess={onSuccess}
            onClose={handleClose}
          />
        </div>

        <WizardNavigation
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onPrevious={prevStep}
          onNext={nextStep}
        />
      </DialogContent>
    </Dialog>
  );
}
