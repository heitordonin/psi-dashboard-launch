
import { supabase } from '@/integrations/supabase/client';

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

export const checkForDuplicates = async (
  data: PatientFormData, 
  userId: string, 
  patientId?: string
): Promise<string | null> => {
  if (!userId) return null;

  const queries = [];

  // Check CPF duplicates for individual patients
  if (data.patient_type === 'individual' && data.cpf && !data.is_payment_from_abroad) {
    const cleanCpf = data.cpf.replace(/\D/g, '');
    let cpfQuery = supabase
      .from('patients')
      .select('id')
      .eq('owner_id', userId)
      .eq('cpf', cleanCpf)
      .limit(1);
    
    // Only apply ID filter if we have a patientId (during edit)
    if (patientId) {
      cpfQuery = cpfQuery.neq('id', patientId);
    }
    
    queries.push(cpfQuery);
  }

  // Check CNPJ duplicates for company patients
  if (data.patient_type === 'company' && data.cnpj && !data.is_payment_from_abroad) {
    const cleanCnpj = data.cnpj.replace(/\D/g, '');
    let cnpjQuery = supabase
      .from('patients')
      .select('id')
      .eq('owner_id', userId)
      .eq('cnpj', cleanCnpj)
      .limit(1);
    
    // Only apply ID filter if we have a patientId (during edit)
    if (patientId) {
      cnpjQuery = cnpjQuery.neq('id', patientId);
    }
    
    queries.push(cnpjQuery);
  }

  // Check email duplicates
  if (data.email) {
    let emailQuery = supabase
      .from('patients')
      .select('id')
      .eq('owner_id', userId)
      .eq('email', data.email.trim())
      .limit(1);
    
    // Only apply ID filter if we have a patientId (during edit)
    if (patientId) {
      emailQuery = emailQuery.neq('id', patientId);
    }
    
    queries.push(emailQuery);
  }

  try {
    const results = await Promise.all(queries);
    
    let duplicateIndex = 0;
    
    // Check CPF duplicate
    if (data.patient_type === 'individual' && data.cpf && !data.is_payment_from_abroad) {
      const { data: cpfResult, error } = results[duplicateIndex];
      if (error) throw error;
      if (cpfResult && cpfResult.length > 0) {
        return 'Já existe um paciente cadastrado com este CPF na sua conta.';
      }
      duplicateIndex++;
    }

    // Check CNPJ duplicate
    if (data.patient_type === 'company' && data.cnpj && !data.is_payment_from_abroad) {
      const { data: cnpjResult, error } = results[duplicateIndex];
      if (error) throw error;
      if (cnpjResult && cnpjResult.length > 0) {
        return 'Já existe um paciente cadastrado com este CNPJ na sua conta.';
      }
      duplicateIndex++;
    }

    // Check email duplicate
    if (data.email) {
      const { data: emailResult, error } = results[duplicateIndex];
      if (error) throw error;
      if (emailResult && emailResult.length > 0) {
        return 'Já existe um paciente cadastrado com este email na sua conta.';
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return 'Erro ao verificar duplicatas. Tente novamente.';
  }
};
