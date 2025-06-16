
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

interface DuplicateCheckResult {
  isDuplicate: boolean;
  message?: string;
  deletedPatient?: {
    id: string;
    full_name: string;
    cpf?: string;
    cnpj?: string;
    email?: string;
  };
}

export const checkForDuplicates = async (
  data: PatientFormData, 
  userId: string, 
  patientId?: string
): Promise<DuplicateCheckResult> => {
  if (!userId) return { isDuplicate: false };

  const queries = [];
  const deletedQueries = [];

  // Check CPF duplicates for individual patients
  if (data.patient_type === 'individual' && data.cpf && !data.is_payment_from_abroad) {
    const cleanCpf = data.cpf.replace(/\D/g, '');
    
    // Check active patients
    let cpfQuery = supabase
      .from('patients')
      .select('id')
      .eq('owner_id', userId)
      .eq('cpf', cleanCpf)
      .is('deleted_at', null)
      .limit(1);
    
    if (patientId) {
      cpfQuery = cpfQuery.neq('id', patientId);
    }
    
    queries.push(cpfQuery);

    // Check deleted patients
    let deletedCpfQuery = supabase
      .from('patients')
      .select('id, full_name, cpf, email')
      .eq('owner_id', userId)
      .eq('cpf', cleanCpf)
      .not('deleted_at', 'is', null)
      .limit(1);
    
    if (patientId) {
      deletedCpfQuery = deletedCpfQuery.neq('id', patientId);
    }
    
    deletedQueries.push(deletedCpfQuery);
  }

  // Check CNPJ duplicates for company patients
  if (data.patient_type === 'company' && data.cnpj && !data.is_payment_from_abroad) {
    const cleanCnpj = data.cnpj.replace(/\D/g, '');
    
    // Check active patients
    let cnpjQuery = supabase
      .from('patients')
      .select('id')
      .eq('owner_id', userId)
      .eq('cnpj', cleanCnpj)
      .is('deleted_at', null)
      .limit(1);
    
    if (patientId) {
      cnpjQuery = cnpjQuery.neq('id', patientId);
    }
    
    queries.push(cnpjQuery);

    // Check deleted patients
    let deletedCnpjQuery = supabase
      .from('patients')
      .select('id, full_name, cnpj, email')
      .eq('owner_id', userId)
      .eq('cnpj', cleanCnpj)
      .not('deleted_at', 'is', null)
      .limit(1);
    
    if (patientId) {
      deletedCnpjQuery = deletedCnpjQuery.neq('id', patientId);
    }
    
    deletedQueries.push(deletedCnpjQuery);
  }

  // Check email duplicates
  if (data.email) {
    // Check active patients
    let emailQuery = supabase
      .from('patients')
      .select('id')
      .eq('owner_id', userId)
      .eq('email', data.email.trim())
      .is('deleted_at', null)
      .limit(1);
    
    if (patientId) {
      emailQuery = emailQuery.neq('id', patientId);
    }
    
    queries.push(emailQuery);

    // Check deleted patients
    let deletedEmailQuery = supabase
      .from('patients')
      .select('id, full_name, cpf, cnpj, email')
      .eq('owner_id', userId)
      .eq('email', data.email.trim())
      .not('deleted_at', 'is', null)
      .limit(1);
    
    if (patientId) {
      deletedEmailQuery = deletedEmailQuery.neq('id', patientId);
    }
    
    deletedQueries.push(deletedEmailQuery);
  }

  try {
    // Check active duplicates first
    const results = await Promise.all(queries);
    const deletedResults = await Promise.all(deletedQueries);
    
    let duplicateIndex = 0;
    
    // Check CPF duplicate in active patients
    if (data.patient_type === 'individual' && data.cpf && !data.is_payment_from_abroad) {
      const { data: cpfResult, error } = results[duplicateIndex];
      if (error) throw error;
      if (cpfResult && cpfResult.length > 0) {
        return { 
          isDuplicate: true, 
          message: 'Já existe um paciente ativo cadastrado com este CPF na sua conta.' 
        };
      }
      duplicateIndex++;
    }

    // Check CNPJ duplicate in active patients
    if (data.patient_type === 'company' && data.cnpj && !data.is_payment_from_abroad) {
      const { data: cnpjResult, error } = results[duplicateIndex];
      if (error) throw error;
      if (cnpjResult && cnpjResult.length > 0) {
        return { 
          isDuplicate: true, 
          message: 'Já existe um paciente ativo cadastrado com este CNPJ na sua conta.' 
        };
      }
      duplicateIndex++;
    }

    // Check email duplicate in active patients
    if (data.email) {
      const { data: emailResult, error } = results[duplicateIndex];
      if (error) throw error;
      if (emailResult && emailResult.length > 0) {
        return { 
          isDuplicate: true, 
          message: 'Já existe um paciente ativo cadastrado com este email na sua conta.' 
        };
      }
    }

    // Check for deleted patients that could be reactivated
    let deletedIndex = 0;
    
    // Check deleted CPF
    if (data.patient_type === 'individual' && data.cpf && !data.is_payment_from_abroad) {
      const { data: deletedCpfResult, error } = deletedResults[deletedIndex];
      if (error) throw error;
      if (deletedCpfResult && deletedCpfResult.length > 0) {
        return {
          isDuplicate: true,
          message: 'REACTIVATE_PATIENT',
          deletedPatient: deletedCpfResult[0]
        };
      }
      deletedIndex++;
    }

    // Check deleted CNPJ
    if (data.patient_type === 'company' && data.cnpj && !data.is_payment_from_abroad) {
      const { data: deletedCnpjResult, error } = deletedResults[deletedIndex];
      if (error) throw error;
      if (deletedCnpjResult && deletedCnpjResult.length > 0) {
        return {
          isDuplicate: true,
          message: 'REACTIVATE_PATIENT',
          deletedPatient: deletedCnpjResult[0]
        };
      }
      deletedIndex++;
    }

    // Check deleted email
    if (data.email) {
      const { data: deletedEmailResult, error } = deletedResults[deletedIndex];
      if (error) throw error;
      if (deletedEmailResult && deletedEmailResult.length > 0) {
        return {
          isDuplicate: true,
          message: 'REACTIVATE_PATIENT',
          deletedPatient: deletedEmailResult[0]
        };
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return { 
      isDuplicate: true, 
      message: 'Erro ao verificar duplicatas. Tente novamente.' 
    };
  }
};
