
import { useState, useEffect } from 'react';
import type { CreatePaymentWizardProps, WizardFormData } from './types';

export function useCreatePaymentWizard({ paymentToEdit, patients, isOpen }: Pick<CreatePaymentWizardProps, 'paymentToEdit' | 'patients' | 'isOpen'>) {
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

  return {
    currentStep,
    setCurrentStep,
    formData,
    updateFormData,
    resetWizard,
    isEditMode
  };
}
