
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
    return 6; // Always 6 steps, but step 3 is skipped for manual charges
  };

  const nextStep = () => {
    if (currentStep === 2 && formData.chargeType === 'manual') {
      // Skip step 3 (fees) for manual charges
      setCurrentStep(4);
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep === 4 && formData.chargeType === 'manual') {
      // Skip step 3 (fees) when going back from step 4 for manual charges
      setCurrentStep(2);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  // Get the current step for display purposes (adjusting for skipped steps)
  const getDisplayStep = () => {
    if (formData.chargeType === 'manual' && currentStep > 2) {
      return currentStep; // Step 4 and 5 show as they are for manual
    }
    return currentStep + 1;
  };

  // Get total display steps (5 for manual, 6 for link)
  const getDisplayTotalSteps = () => {
    return formData.chargeType === 'manual' ? 5 : 6;
  };

  return {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    resetWizard,
    getTotalSteps,
    goToStep,
    getDisplayStep,
    getDisplayTotalSteps
  };
}
