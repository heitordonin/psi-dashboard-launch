
import { useEffect } from 'react';
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

export function CreatePaymentWizard({ 
  isOpen, 
  onClose, 
  onSuccess, 
  patients, 
  paymentToEdit = null 
}: CreatePaymentWizardProps) {
  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    resetWizard,
    getTotalSteps,
    getCurrentStepIndex,
    getValidSteps,
    goToStep
  } = useWizardState();

  const isEditMode = !!paymentToEdit;

  // Initialize form data when editing a payment
  useEffect(() => {
    if (isEditMode && paymentToEdit) {
      console.log('Inicializando modo de edição com:', paymentToEdit);
      
      // Reset wizard first
      resetWizard();
      
      // Determine charge type from has_payment_link
      const chargeType = paymentToEdit.has_payment_link ? 'link' : 'manual';
      
      // Populate form data with payment data
      updateFormData({
        chargeType,
        paymentType: 'single', // Default for existing payments
        amount: Number(paymentToEdit.amount),
        due_date: paymentToEdit.due_date,
        description: paymentToEdit.description || '',
        patient_id: paymentToEdit.patient_id,
        payer_cpf: paymentToEdit.payer_cpf || '',
        paymentTitular: paymentToEdit.payer_cpf ? 'other' : 'patient',
        isReceived: paymentToEdit.status === 'paid',
        receivedDate: paymentToEdit.paid_date || '',
        paymentMethods: {
          boleto: true,
          creditCard: true
        },
        monthlyInterest: 0,
        lateFee: 0,
        sendEmailNotification: false,
        email: ''
      });

      // Se for manual charge, ir direto para o step 2 (pular configurações de tipo)
      if (chargeType === 'manual') {
        goToStep(2);
      }
    } else if (!isEditMode) {
      // Reset wizard for new payment
      resetWizard();
    }
  }, [isEditMode, paymentToEdit, resetWizard, updateFormData, goToStep]);

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  // Get current step title based on actual step
  const getCurrentStepTitle = () => {
    return STEP_TITLES[currentStep] || 'Etapa';
  };

  // Get wizard title based on mode
  const getWizardTitle = () => {
    return isEditMode ? 'Editar Cobrança' : 'Nova Cobrança';
  };

  // Determine if next button should be disabled based on current step validation
  const isNextDisabled = () => {
    const selectedPatient = patients.find(p => p.id === formData.patient_id);
    
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
        // Validação para o Step 4 (Dados do Pagador)
        if (!formData.patient_id) return true;
        
        // Para pacientes do exterior, não precisa de CPF
        if (selectedPatient?.is_payment_from_abroad) return false;
        
        // Para empresas, sempre precisa do CNPJ
        if (selectedPatient?.patient_type === 'company') {
          return !formData.payer_cpf;
        }
        
        // Para pacientes individuais, precisa do CPF se não for o próprio paciente
        if (formData.paymentTitular === 'other') {
          return !formData.payer_cpf;
        }
        
        return false;
      case 5:
        return false; // Summary step
      default:
        return false;
    }
  };

  // Check if we can show previous button
  const canGoBack = () => {
    const currentIndex = getCurrentStepIndex();
    return currentIndex > 0;
  };

  // Check if we can show next button (not on last step)
  const canGoNext = () => {
    const currentIndex = getCurrentStepIndex();
    const totalSteps = getTotalSteps();
    return currentIndex < totalSteps - 1;
  };

  console.log('Wizard State:', {
    currentStep,
    currentStepIndex: getCurrentStepIndex(),
    totalSteps: getTotalSteps(),
    validSteps: getValidSteps(),
    chargeType: formData.chargeType,
    isEditMode
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <WizardHeader
          currentStep={getCurrentStepIndex() + 1}
          totalSteps={getTotalSteps()}
          stepTitle={getCurrentStepTitle()}
          onClose={handleClose}
          wizardTitle={getWizardTitle()}
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
            isEditMode={isEditMode}
            paymentToEdit={paymentToEdit}
          />
        </div>

        <WizardNavigation
          currentStep={getCurrentStepIndex()}
          totalSteps={getTotalSteps()}
          onPrevious={prevStep}
          onNext={nextStep}
          isNextDisabled={isNextDisabled()}
          onClose={handleClose}
          canGoBack={canGoBack()}
          canGoNext={canGoNext()}
        />
      </DialogContent>
    </Dialog>
  );
}
