
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WizardHeader } from './wizard/WizardHeader';
import { WizardStepRenderer } from './wizard/WizardStepRenderer';
import { WizardNavigation } from './wizard/WizardNavigation';
import type { CreatePaymentWizardProps, WizardFormData } from './wizard/types';

const STEP_TITLES = [
  'Tipo de Cobrança',
  'Tipo de Pagamento',
  'Detalhes do Pagamento', 
  'Juros e Multa',
  'Dados do Pagador',
  'Resumo e Confirmação'
];

export function CreatePaymentWizard({ isOpen, onClose, onSuccess, patients, paymentToEdit }: CreatePaymentWizardProps) {
  const isEditMode = !!paymentToEdit;
  const [currentStep, setCurrentStep] = useState(isEditMode ? 1 : 0);
  const [formData, setFormData] = useState<WizardFormData>({
    chargeType: 'link',
    paymentType: 'single',
    amount: 0,
    due_date: '',
    description: '',
    paymentMethods: {
      boleto: true,
      creditCard: false
    },
    monthlyInterest: 0,
    lateFee: 0,
    patient_id: '',
    paymentTitular: 'patient',
    payer_cpf: '',
    sendEmailNotification: false,
    email: '',
    isReceived: false,
    receivedDate: ''
  });

  // Initialize form data when editing a payment
  useEffect(() => {
    if (paymentToEdit && isOpen) {
      const patient = patients.find(p => p.id === paymentToEdit.patient_id);
      
      setFormData({
        chargeType: paymentToEdit.has_payment_link ? 'link' : 'manual',
        paymentType: 'single',
        amount: Number(paymentToEdit.amount),
        due_date: paymentToEdit.due_date,
        description: paymentToEdit.description || '',
        paymentMethods: { boleto: true, creditCard: false },
        monthlyInterest: 0,
        lateFee: 0,
        patient_id: paymentToEdit.patient_id,
        paymentTitular: paymentToEdit.payer_cpf ? 'other' : 'patient',
        payer_cpf: paymentToEdit.payer_cpf || '',
        sendEmailNotification: false,
        email: patient?.email || '',
        isReceived: paymentToEdit.status === 'paid',
        receivedDate: paymentToEdit.paid_date || ''
      });
    }
  }, [paymentToEdit, isOpen, patients]);

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      
      // Handle isReceived logic
      if ('isReceived' in updates) {
        if (updates.isReceived) {
          newData.receivedDate = new Date().toISOString().split('T')[0];
        } else {
          newData.receivedDate = '';
        }
      }
      
      return newData;
    });
  };

  const getTotalSteps = () => {
    // Always return 6 for consistent internal step calculation
    return 6;
  };

  const nextStep = () => {
    const maxStep = 5; // 0-based indexing, so step 5 is the last step
    
    if (currentStep < maxStep) {
      let nextStepNumber = currentStep + 1;
      
      // Skip step 3 (Fees and Interest) for manual charges
      if (formData.chargeType === 'manual' && nextStepNumber === 3) {
        nextStepNumber = 4;
      }
      
      setCurrentStep(nextStepNumber);
    }
  };

  const prevStep = () => {
    const minStep = isEditMode ? 1 : 0; // In edit mode, can't go below step 1
    
    if (currentStep > minStep) {
      let prevStepNumber = currentStep - 1;
      
      // Skip step 3 (Fees and Interest) when going back for manual charges
      if (formData.chargeType === 'manual' && prevStepNumber === 3) {
        prevStepNumber = 2;
      }
      
      setCurrentStep(prevStepNumber);
    }
  };

  const resetWizard = () => {
    setCurrentStep(isEditMode ? 1 : 0);
    setFormData({
      chargeType: 'link',
      paymentType: 'single',
      amount: 0,
      due_date: '',
      description: '',
      paymentMethods: { boleto: true, creditCard: false },
      monthlyInterest: 0,
      lateFee: 0,
      patient_id: '',
      paymentTitular: 'patient',
      payer_cpf: '',
      sendEmailNotification: false,
      email: '',
      isReceived: false,
      receivedDate: ''
    });
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  // Get current step title based on actual step and edit mode
  const getCurrentStepTitle = () => {
    if (isEditMode) {
      // For edit mode, map steps to skip the charge type step
      const editStepTitles = [
        'Tipo de Pagamento',     // Step 1 (was Step 1)
        'Detalhes do Pagamento', // Step 2 (was Step 2)
        'Juros e Multa',         // Step 3 (was Step 3)
        'Dados do Pagador',      // Step 4 (was Step 4)
        'Resumo e Confirmação'   // Step 5 (was Step 5)
      ];
      
      if (formData.chargeType === 'manual') {
        // For manual charges in edit mode, also map around the skipped fees step
        const manualEditStepTitles = [
          'Tipo de Pagamento',     // Step 1
          'Detalhes do Pagamento', // Step 2
          'Dados do Pagador',      // Step 4 (mapped)
          'Resumo e Confirmação'   // Step 5 (mapped)
        ];
        
        if (currentStep === 1) return manualEditStepTitles[0];
        if (currentStep === 2) return manualEditStepTitles[1];
        if (currentStep === 4) return manualEditStepTitles[2];
        if (currentStep === 5) return manualEditStepTitles[3];
      }
      
      return editStepTitles[currentStep - 1] || 'Etapa';
    }
    
    // For create mode, use the original logic
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
        // Complex validation for Step 4
        if (!formData.patient_id) return true;
        
        // For foreign patients, CPF is not required
        if (selectedPatient?.is_payment_from_abroad) return false;
        
        // For companies, CNPJ is always required
        if (selectedPatient?.patient_type === 'company') {
          return !formData.payer_cpf;
        }
        
        // For individual patients, CPF is required
        return !formData.payer_cpf;
      case 5:
        return false; // Summary step
      default:
        return false;
    }
  };

  // Calculate display step number for the header - this is only for visual display
  const getDisplayStepNumber = () => {
    if (isEditMode) {
      // In edit mode, show steps as 1-5 instead of 1-6
      if (formData.chargeType === 'manual') {
        // For manual charges, adjust for skipped fees step
        if (currentStep === 1) return 1;
        if (currentStep === 2) return 2;
        if (currentStep === 4) return 3;
        if (currentStep === 5) return 4;
      }
      return currentStep; // For link charges, just use the current step
    }
    
    // For create mode, use the original logic
    return currentStep + 1;
  };

  // Calculate display total steps for the header - this is only for visual display
  const getDisplayTotalSteps = () => {
    if (isEditMode) {
      if (formData.chargeType === 'manual') {
        return 4; // Manual charges skip the fees step in edit mode
      }
      return 5; // Edit mode skips the charge type step
    }
    
    if (formData.chargeType === 'manual') {
      return 5; // Manual charges skip the fees step
    }
    
    return 6; // All steps for link charges in create mode
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <WizardHeader
          currentStep={getDisplayStepNumber()}
          totalSteps={getDisplayTotalSteps()}
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
          totalSteps={getTotalSteps()}
          onPrevious={prevStep}
          onNext={nextStep}
          isNextDisabled={isNextDisabled()}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
