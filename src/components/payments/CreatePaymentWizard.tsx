
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WizardHeader } from './wizard/WizardHeader';
import { WizardStepRenderer } from './wizard/WizardStepRenderer';
import { WizardNavigation } from './wizard/WizardNavigation';
import { useWizardState } from './wizard/useWizardState';
import type { CreatePaymentWizardProps } from './wizard/types';

const STEP_TITLES = [
  'Tipo de Cobrança',
  'Tipo de Pagamento',
  'Detalhes do Pagamento', 
  'Juros e Multa',
  'Dados do Pagador',
  'Resumo e Confirmação'
];

export function CreatePaymentWizard({ isOpen, onClose, onSuccess, patients }: CreatePaymentWizardProps) {
  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    resetWizard,
    getTotalSteps
  } = useWizardState();

  const totalSteps = getTotalSteps();

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  // Get current step title based on actual step and charge type
  const getCurrentStepTitle = () => {
    if (formData.chargeType === 'manual') {
      // For manual charges, map the actual step numbers to appropriate titles
      const manualStepTitles = [
        'Tipo de Cobrança',      // Step 0
        'Tipo de Pagamento',     // Step 1
        'Dados do Pagador',      // Step 4 (mapped)
        'Resumo e Confirmação'   // Step 5 (mapped)
      ];
      
      if (currentStep === 0) return manualStepTitles[0];
      if (currentStep === 1) return manualStepTitles[1];
      if (currentStep === 4) return manualStepTitles[2];
      if (currentStep === 5) return manualStepTitles[3];
    }
    
    return STEP_TITLES[currentStep] || 'Etapa';
  };

  // Determine if next button should be disabled based on current step validation
  const isNextDisabled = () => {
    switch (currentStep) {
      case 0:
        return !formData.chargeType;
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
          currentStep={currentStep + 1}
          totalSteps={totalSteps}
          stepTitle={getCurrentStepTitle()}
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
          totalSteps={totalSteps}
          onPrevious={prevStep}
          onNext={nextStep}
          isNextDisabled={isNextDisabled()}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
