
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

  // Definir quais steps são válidos para cada tipo de charge
  const getValidSteps = () => {
    if (formData.chargeType === 'manual') {
      return [0, 1, 2, 4, 5]; // Pula step 3 (taxas/juros)
    }
    return [0, 1, 2, 3, 4, 5]; // Todos os steps para link
  };

  const getTotalSteps = () => {
    return getValidSteps().length;
  };

  const getCurrentStepIndex = () => {
    const validSteps = getValidSteps();
    return validSteps.indexOf(currentStep);
  };

  const nextStep = () => {
    const validSteps = getValidSteps();
    const currentIndex = getCurrentStepIndex();
    
    if (currentIndex < validSteps.length - 1) {
      setCurrentStep(validSteps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const validSteps = getValidSteps();
    const currentIndex = getCurrentStepIndex();
    
    if (currentIndex > 0) {
      setCurrentStep(validSteps[currentIndex - 1]);
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

  // Função para ir para um step específico (útil no modo edição)
  const goToStep = (stepNumber: number) => {
    const validSteps = getValidSteps();
    if (validSteps.includes(stepNumber)) {
      setCurrentStep(stepNumber);
    }
  };

  return {
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
  };
}
