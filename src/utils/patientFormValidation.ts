
import { z } from 'zod';
import { validateCPF, validateCNPJ, validateEmail, validatePhoneNumber } from './securityValidation';

export const patientSchema = z.object({
  full_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  cpf: z.string()
    .optional()
    .refine((val) => !val || validateCPF(val), {
      message: 'CPF inválido'
    }),
  
  cnpj: z.string()
    .optional()
    .refine((val) => !val || validateCNPJ(val), {
      message: 'CNPJ inválido'
    }),
  
  email: z.string()
    .optional()
    .refine((val) => !val || validateEmail(val), {
      message: 'Email inválido'
    }),
  
  phone: z.string()
    .optional()
    .refine((val) => !val || validatePhoneNumber(val), {
      message: 'Telefone inválido'
    }),
  
  patient_type: z.enum(['individual', 'company']),
  
  has_financial_guardian: z.boolean().default(false),
  
  guardian_cpf: z.string()
    .optional()
    .refine((val) => !val || validateCPF(val), {
      message: 'CPF do responsável inválido'
    }),
  
  is_payment_from_abroad: z.boolean().default(false)
}).refine((data) => {
  // If patient is individual, CPF is required
  if (data.patient_type === 'individual' && !data.cpf) {
    return false;
  }
  // If patient is company, CNPJ is required
  if (data.patient_type === 'company' && !data.cnpj) {
    return false;
  }
  // If has financial guardian, guardian CPF is required
  if (data.has_financial_guardian && !data.guardian_cpf) {
    return false;
  }
  return true;
}, {
  message: 'Campos obrigatórios não preenchidos corretamente',
  path: ['full_name'] // Show error on main field
});

export type PatientFormData = z.infer<typeof patientSchema>;

// Legacy validation function for existing forms
export const validatePatientForm = (formData: any): Record<string, string> => {
  const result = patientSchema.safeParse(formData);
  
  if (result.success) {
    return {}; // No errors
  }
  
  const errors: Record<string, string> = {};
  
  // Convert Zod errors to our format
  result.error.issues.forEach((issue) => {
    const fieldName = issue.path[0] as string;
    if (fieldName && !errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  });
  
  // Handle custom validation rules
  if (formData.patient_type === 'individual' && !formData.cpf && !formData.is_payment_from_abroad) {
    errors.cpf = 'CPF é obrigatório para pessoa física';
  }
  
  if (formData.patient_type === 'company' && !formData.cnpj && !formData.is_payment_from_abroad) {
    errors.cnpj = 'CNPJ é obrigatório para pessoa jurídica';
  }
  
  if (formData.has_financial_guardian && !formData.guardian_cpf) {
    errors.guardian_cpf = 'CPF do responsável é obrigatório';
  }
  
  return errors;
};

// Additional validation for admin operations
export const validateAdminPatientOperation = (userId: string, isAdmin: boolean) => {
  if (!userId) {
    throw new Error('Usuário não autenticado');
  }
  
  // Add any additional admin-specific validations here
  return true;
};
