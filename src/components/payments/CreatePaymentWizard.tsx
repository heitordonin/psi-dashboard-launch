
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

export function CreatePaymentWizard({ isOpen, onClose, onSuccess, patients, paymentToEdit }: CreatePaymentWizardProps) {
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
  const isEditMode = !!paymentToEdit;

  // Initialize form data when editing a payment
  useEffect(() => {
    if (paymentToEdit && isOpen) {
      // Find the patient for this payment
      const patient = patients.find(p => p.id === paymentToEdit.patient_id);
      
      updateFormData({
        chargeType: paymentToEdit.has_payment_link ? 'link' : 'manual',
        paymentType: 'single', // Default since we don't have subscription data
        amount: Number(paymentToEdit.amount),
        due_date: paymentToEdit.due_date,
        description: paymentToEdit.description || '',
        patient_id: paymentToEdit.patient_id,
        payer_cpf: paymentToEdit.payer_cpf || '',
        paymentTitular: paymentToEdit.payer_cpf ? 'other' : 'patient',
        email: patient?.email || '',
        isReceived: paymentToEdit.status === 'paid',
        receivedDate: paymentToEdit.paid_date || ''
      });
    }
  }, [paymentToEdit, isOpen, patients, updateFormData]);

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
        'Detalhes do Pagamento', // Step 2
        'Dados do Pagador',      // Step 4 (mapped)
        'Resumo e Confirmação'   // Step 5 (mapped)
      ];
      
      if (currentStep === 0) return manualStepTitles[0];
      if (currentStep === 1) return manualStepTitles[1];
      if (currentStep === 2) return manualStepTitles[2];
      if (currentStep === 4) return manualStepTitles[3];
      if (currentStep === 5) return manualStepTitles[4];
    }
    
    return STEP_TITLES[currentStep] || 'Etapa';
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
        // Validação mais complexa para o Step 4
        if (!formData.patient_id) return true;
        
        // Para pacientes do exterior, não precisa de CPF
        if (selectedPatient?.is_payment_from_abroad) return false;
        
        // Para empresas, sempre precisa do CNPJ
        if (selectedPatient?.patient_type === 'company') {
          return !formData.payer_cpf;
        }
        
        // Para pacientes individuais, precisa do CPF
        return !formData.payer_cpf;
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
          title={isEditMode ? 'Editar Cobrança' : 'Nova Cobrança'}
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
            paymentToEdit={paymentToEdit}
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
