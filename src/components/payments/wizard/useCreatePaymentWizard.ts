
import { useState, useEffect } from 'react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import type { CreatePaymentWizardProps, WizardFormData } from './types';

export function useCreatePaymentWizard({ paymentToEdit, patients, isOpen }: Pick<CreatePaymentWizardProps, 'paymentToEdit' | 'patients' | 'isOpen'>) {
  const { canPerformAdminAction } = useSecureAuth();
  const isEditMode = !!paymentToEdit;
  const isAdmin = canPerformAdminAction();
  
  const [currentStep, setCurrentStep] = useState(isEditMode ? 1 : 0);
  const [formData, setFormData] = useState<WizardFormData>({
    chargeType: isAdmin ? 'link' : 'manual', // Default to 'manual' for non-admins
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
    receivedDate: '',
    retroactiveDateConfirmed: false
  });

  // Initialize form data when editing a payment
  useEffect(() => {
    if (paymentToEdit && isOpen) {
      const patient = patients.find(p => p.id === paymentToEdit.patient_id);
      
      // Determine if payer_cpf matches patient's document
      let paymentTitular: 'patient' | 'other' = 'patient';
      if (paymentToEdit.payer_cpf && patient) {
        // For company patients, compare with CNPJ
        if (patient.patient_type === 'company') {
          paymentTitular = paymentToEdit.payer_cpf === patient.cnpj ? 'patient' : 'other';
        } 
        // For foreign patients, if payer_cpf exists, it's always 'other' since they don't have CPF
        else if (patient.is_payment_from_abroad) {
          paymentTitular = 'other';
        } 
        // For individual patients, compare with CPF
        else {
          paymentTitular = paymentToEdit.payer_cpf === patient.cpf ? 'patient' : 'other';
        }
      }
      
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
        paymentTitular,
        payer_cpf: paymentToEdit.payer_cpf || '',
        sendEmailNotification: false,
        email: patient?.email || '',
        isReceived: paymentToEdit.status === 'paid',
        receivedDate: paymentToEdit.paid_date || '',
        retroactiveDateConfirmed: false
      });
    }
  }, [paymentToEdit, isOpen, patients]);

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      
      // Prevent non-admins from selecting 'link' chargeType
      if ('chargeType' in updates && updates.chargeType === 'link' && !isAdmin) {
        newData.chargeType = 'manual';
      }
      
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
      chargeType: isAdmin ? 'link' : 'manual', // Default to 'manual' for non-admins
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
      receivedDate: '',
      retroactiveDateConfirmed: false
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
