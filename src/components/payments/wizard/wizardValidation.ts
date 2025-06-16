
import type { WizardFormData, Patient } from './types';

export function isNextDisabled(currentStep: number, formData: WizardFormData, patients: Patient[]) {
  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  
  switch (currentStep) {
    case 0:
      return !formData.chargeType;
    case 1:
      return !formData.paymentType;
    case 2:
      // For manual charges, any date is valid
      // For payment links, only today or future dates are valid
      if (formData.chargeType === 'manual') {
        return !formData.amount || !formData.due_date || !formData.description;
      } else {
        // Payment link validation
        const isDueDateValid = !formData.due_date || 
          new Date(formData.due_date) >= new Date(new Date().toDateString());
        
        return !formData.amount || !formData.due_date || !formData.description || !isDueDateValid;
      }
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
}
