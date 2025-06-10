
import { validateCpf } from '@/utils/validators';

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  cpf: string;
  phone: string;
}

export const validateSignupForm = (formData: SignupFormData) => {
  const newErrors: Record<string, string> = {};

  if (!formData.email) {
    newErrors.email = 'Email é obrigatório';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'Email deve ter um formato válido';
  }

  if (!formData.password) {
    newErrors.password = 'Senha é obrigatória';
  } else if (formData.password.length < 6) {
    newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
  }

  if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Senhas não coincidem';
  }

  if (!formData.fullName) {
    newErrors.fullName = 'Nome completo é obrigatório';
  }

  if (!formData.cpf) {
    newErrors.cpf = 'CPF é obrigatório';
  } else if (!validateCpf(formData.cpf)) {
    newErrors.cpf = 'CPF deve ter um formato válido';
  }

  if (!formData.phone) {
    newErrors.phone = 'Celular é obrigatório';
  } else if (formData.phone.replace(/\D/g, '').length < 10) {
    newErrors.phone = 'Celular deve ter pelo menos 10 dígitos';
  }

  return newErrors;
};
