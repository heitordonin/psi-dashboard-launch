
import { validateCPF, validateCNPJ, sanitizeTextInput, validateAmount } from '@/utils/securityValidation';
import { validateDueDateReceitaSaude, validatePaymentDateReceitaSaude } from '@/utils/receitaSaudeValidation';
import { isDemoUserByEmail } from '@/utils/demoUser';

export const validatePaymentForm = (
  formData: {
    patient_id: string;
    amount: number;
    due_date: string;
    payer_cpf: string;
    description?: string;
  },
  isReceived: boolean,
  receivedDate: string,
  paymentTitular: 'patient' | 'other',
  selectedPatient?: any,
  userEmail?: string
): string | null => {
  // Skip validation for demo user
  if (userEmail && isDemoUserByEmail(userEmail)) {
    console.log('Skipping payment form validation for demo user:', userEmail);
    return null;
  }
  if (!formData.patient_id || !formData.amount) {
    return 'Preencha todos os campos obrigatórios';
  }

  // Validação robusta de valor monetário
  if (!validateAmount(formData.amount)) {
    return 'Valor deve ser um número válido entre R$ 0,01 e R$ 999.999.999,99';
  }

  if (isReceived && !receivedDate) {
    return 'Data de recebimento é obrigatória';
  }

  if (!isReceived && !formData.due_date) {
    return 'Data de vencimento é obrigatória';
  }

  // Validação de documento baseada no tipo de paciente
  if (selectedPatient && !selectedPatient.is_payment_from_abroad) {
    if (selectedPatient.patient_type === 'company') {
      // Para empresas, validar CNPJ
      if (!formData.payer_cpf || !validateCNPJ(formData.payer_cpf)) {
        return 'CNPJ é obrigatório e deve ser válido para pessoa jurídica';
      }
    } else {
      // Para pessoas físicas, validar CPF
      if (paymentTitular === 'other' && (!formData.payer_cpf || !validateCPF(formData.payer_cpf))) {
        return 'CPF do titular é obrigatório e deve ser válido';
      }
      if (paymentTitular === 'patient' && selectedPatient.cpf && !validateCPF(selectedPatient.cpf)) {
        return 'CPF do paciente deve ser válido';
      }
    }
  }

  // Validação Receita Saúde para data de vencimento retroativa
  if (!isReceived && formData.due_date) {
    const dueDateValidation = validateDueDateReceitaSaude(formData.due_date);
    if (!dueDateValidation.isValid) {
      return dueDateValidation.errorMessage;
    }
  }

  // Validação Receita Saúde para data de recebimento retroativa
  if (isReceived && receivedDate) {
    const paymentDateValidation = validatePaymentDateReceitaSaude(receivedDate);
    if (!paymentDateValidation.isValid) {
      return paymentDateValidation.errorMessage;
    }
  }

  // Sanitizar descrição se fornecida
  if (formData.description && formData.description.length > 500) {
    return 'Descrição deve ter no máximo 500 caracteres';
  }

  return null;
};

// Função para sanitizar dados do formulário antes de salvar
export const sanitizePaymentFormData = (formData: any) => {
  return {
    ...formData,
    description: formData.description ? sanitizeTextInput(formData.description, 500) : null,
    payer_cpf: formData.payer_cpf ? formData.payer_cpf.replace(/\D/g, '') : null
  };
};
