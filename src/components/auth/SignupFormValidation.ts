
import { validateCPF, validatePhoneNumber, validateEmail, sanitizeTextInput } from '@/utils/securityValidation';

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  cpf: string;
  phone: string;
  acceptedTerms: boolean;
}

export const validateSignupForm = (formData: SignupFormData) => {
  const newErrors: Record<string, string> = {};

  // Validação robusta de email
  if (!formData.email) {
    newErrors.email = 'Email é obrigatório';
  } else if (!validateEmail(formData.email)) {
    newErrors.email = 'Email deve ter um formato válido';
  }

  if (!formData.password) {
    newErrors.password = 'Senha é obrigatória';
  } else if (formData.password.length < 6) {
    newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
  } else if (formData.password.length > 128) {
    newErrors.password = 'Senha deve ter no máximo 128 caracteres';
  }

  if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Senhas não coincidem';
  }

  if (!formData.fullName) {
    newErrors.fullName = 'Nome completo é obrigatório';
  } else if (formData.fullName.length < 2) {
    newErrors.fullName = 'Nome deve ter pelo menos 2 caracteres';
  } else if (formData.fullName.length > 100) {
    newErrors.fullName = 'Nome deve ter no máximo 100 caracteres';
  }

  // Validação robusta de CPF
  if (!formData.cpf) {
    newErrors.cpf = 'CPF é obrigatório';
  } else if (!validateCPF(formData.cpf)) {
    newErrors.cpf = 'CPF deve ter um formato válido';
  }

  // Validação robusta de telefone
  if (!formData.phone) {
    newErrors.phone = 'Celular é obrigatório';
  } else if (!validatePhoneNumber(formData.phone)) {
    newErrors.phone = 'Celular deve ter um formato válido';
  }

  // Validação de aceite dos termos
  if (!formData.acceptedTerms) {
    newErrors.acceptedTerms = 'Você deve aceitar os Termos de Uso para continuar';
  }

  return newErrors;
};

// Função para sanitizar dados antes de enviar
export const sanitizeSignupFormData = (formData: SignupFormData) => {
  return {
    ...formData,
    fullName: sanitizeTextInput(formData.fullName, 100),
    cpf: formData.cpf.replace(/\D/g, ''),
    phone: formData.phone.replace(/\D/g, ''),
    email: formData.email.toLowerCase().trim()
  };
};
