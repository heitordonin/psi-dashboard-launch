
import { useState } from 'react';
import type { WizardFormData } from './types';

export function useWizardState() {
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
    // Dynamic step calculation based on charge type
    if (formData.chargeType === 'manual') {
      return 5; // Skip payment methods and fees steps
    }
    return 6; // All steps for link charges
  };

  const nextStep = () => {
    const totalSteps = getTotalSteps();
    if (currentStep < totalSteps - 1) {
      let nextStepNumber = currentStep + 1;
      
      // Skip steps for manual charges
      if (formData.chargeType === 'manual') {
        if (nextStepNumber === 2) nextStepNumber = 4; // Skip payment methods (step 2)
        if (nextStepNumber === 3) nextStepNumber = 4; // Skip fees (step 3)
      }
      
      setCurrentStep(nextStepNumber);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      let prevStepNumber = currentStep - 1;
      
      // Skip steps for manual charges when going back
      if (formData.chargeType === 'manual') {
        if (prevStepNumber === 3) prevStepNumber = 1; // Skip fees (step 3)
        if (prevStepNumber === 2) prevStepNumber = 1; // Skip payment methods (step 2)
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

  return {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    resetWizard,
    getTotalSteps
  };
}
