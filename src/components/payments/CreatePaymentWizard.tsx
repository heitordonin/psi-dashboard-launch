
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
  const [currentStep, setCurrentStep] = useState(0);
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

  const isEditMode = !!paymentToEdit;

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
    // Always return 6 steps total (0-5 indexing)
    return 6;
  };

  const nextStep = () => {
    const totalSteps = getTotalSteps();
    if (currentStep < totalSteps - 1) {
      let nextStepNumber = currentStep + 1;
      
      // Skip step 3 (Fees and Interest) for manual charges
      if (formData.chargeType === 'manual' && nextStepNumber === 3) {
        nextStepNumber = 4;
      }
      
      setCurrentStep(nextStepNumber);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      let prevStepNumber = currentStep - 1;
      
      // Skip step 3 (Fees and Interest) when going back for manual charges
      if (formData.chargeType === 'manual' && prevStepNumber === 3) {
        prevStepNumber = 2;
      }
      
      setCurrentStep(prevStepNumber);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <WizardHeader
          currentStep={currentStep + 1}
          totalSteps={getTotalSteps()}
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
