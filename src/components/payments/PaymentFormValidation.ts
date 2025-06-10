
export const validateCpf = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/\D/g, '');
  return cleanCpf.length === 11;
};

export const validatePaymentForm = (
  formData: {
    patient_id: string;
    amount: number;
    due_date: string;
    payer_cpf: string;
  },
  isReceived: boolean,
  receivedDate: string,
  paymentTitular: 'patient' | 'other'
) => {
  if (!formData.patient_id || !formData.amount) {
    return 'Preencha todos os campos obrigatórios';
  }

  if (isNaN(formData.amount) || formData.amount <= 0) {
    return 'Valor deve ser um número válido maior que zero';
  }

  if (isReceived && !receivedDate) {
    return 'Data de recebimento é obrigatória';
  }

  if (!isReceived && !formData.due_date) {
    return 'Data de vencimento é obrigatória';
  }

  if (paymentTitular === 'other' && !validateCpf(formData.payer_cpf)) {
    return 'CPF do titular é obrigatório e deve ser válido';
  }

  return null;
};
