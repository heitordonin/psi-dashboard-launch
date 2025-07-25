
import { validateAmount } from '@/utils/securityValidation';
import { validateDueDateReceitaSaude } from '@/utils/receitaSaudeValidation';
import type { WizardFormData, Patient } from './types';

export function isNextDisabled(currentStep: number, formData: WizardFormData, patients: Patient[]) {
  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  
  switch (currentStep) {
    case 0:
      return !formData.chargeType;
    case 1:
      return !formData.paymentType;
    case 2:
      // Validação robusta de valor e descrição
      const isAmountValid = formData.amount && validateAmount(formData.amount);
      const isDescriptionValid = formData.description && 
        formData.description.length >= 3 && 
        formData.description.length <= 500;
      
      // Validação Receita Saúde para datas retroativas
      if (formData.due_date) {
        const receitaSaudeValidation = validateDueDateReceitaSaude(formData.due_date);
        if (!receitaSaudeValidation.isValid && !formData.retroactiveDateConfirmed) {
          return true; // Bloqueia se inválido E não confirmado
        }
      }

      // Para manual charges, aplicar apenas validação Receita Saúde
      // Para payment links, aplicar validação Receita Saúde + data futura
      if (formData.chargeType === 'manual') {
        return !isAmountValid || !formData.due_date || !isDescriptionValid;
      } else {
        // Payment link validation: deve ser hoje ou futuro
        const isDueDateValid = !formData.due_date || 
          new Date(formData.due_date) >= new Date(new Date().toDateString());
        
        return !isAmountValid || !formData.due_date || !isDescriptionValid || !isDueDateValid;
      }
    case 3:
      return false; // Este step não tem campos obrigatórios
    case 4:
      // Validação complexa para Step 4 (já robusta)
      if (!formData.patient_id) return true;
      
      // Para pacientes do exterior, CPF não é obrigatório
      if (selectedPatient?.is_payment_from_abroad) return false;
      
      // Para empresas, CNPJ é sempre obrigatório
      if (selectedPatient?.patient_type === 'company') {
        return !formData.payer_cpf;
      }
      
      // Para pacientes individuais, CPF é obrigatório
      return !formData.payer_cpf;
    case 5:
      return false; // Summary step
    default:
      return false;
  }
}

// Função para validar dados completos do wizard
export function validateWizardFormData(formData: WizardFormData, selectedPatient?: Patient) {
  const errors: string[] = [];

  // Validação de valor
  if (!validateAmount(formData.amount)) {
    errors.push('Valor deve estar entre R$ 0,01 e R$ 999.999.999,99');
  }

  // Validação Receita Saúde para data de vencimento
  if (formData.due_date) {
    const dueDateValidation = validateDueDateReceitaSaude(formData.due_date);
    if (!dueDateValidation.isValid && !formData.retroactiveDateConfirmed) {
      errors.push(dueDateValidation.errorMessage || 'Data de vencimento inválida');
    }
  }

  // Validação de descrição
  if (!formData.description || formData.description.length < 3) {
    errors.push('Descrição deve ter pelo menos 3 caracteres');
  }
  if (formData.description && formData.description.length > 500) {
    errors.push('Descrição deve ter no máximo 500 caracteres');
  }

  // Validação de email se notificação estiver habilitada
  if (formData.sendEmailNotification && formData.email) {
    if (!formData.email.includes('@') || formData.email.length < 5) {
      errors.push('Email deve ter um formato válido');
    }
  }

  return errors;
}
