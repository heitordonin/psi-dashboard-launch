
import { validateCpf, validateCnpj } from '@/utils/validators';

interface PatientFormData {
  full_name: string;
  patient_type: "individual" | "company";
  cpf: string;
  cnpj: string;
  email: string;
  phone: string;
  has_financial_guardian: boolean;
  guardian_cpf: string;
  is_payment_from_abroad: boolean;
}

export const validatePatientForm = (formData: PatientFormData) => {
  const newErrors: Record<string, string> = {};

  if (!formData.full_name.trim()) {
    newErrors.full_name = 'Nome completo é obrigatório';
  }

  // Document validation based on type and payment origin
  if (!formData.is_payment_from_abroad) {
    if (formData.patient_type === 'individual') {
      if (!formData.cpf) {
        newErrors.cpf = 'CPF é obrigatório para pessoa física';
      } else if (!validateCpf(formData.cpf)) {
        newErrors.cpf = 'CPF deve ter um formato válido';
      }
    } else {
      if (!formData.cnpj) {
        newErrors.cnpj = 'CNPJ é obrigatório para empresa';
      } else if (!validateCnpj(formData.cnpj)) {
        newErrors.cnpj = 'CNPJ deve ter um formato válido';
      }
    }
  }

  if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'Email deve ter um formato válido';
  }

  if (formData.has_financial_guardian) {
    if (!formData.guardian_cpf) {
      newErrors.guardian_cpf = 'CPF do responsável é obrigatório';
    } else if (!validateCpf(formData.guardian_cpf)) {
      newErrors.guardian_cpf = 'CPF do responsável deve ter um formato válido';
    }
  }

  return newErrors;
};
