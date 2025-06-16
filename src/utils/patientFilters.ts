
import type { Patient } from '@/types/patient';
import { PatientFilters } from '@/components/patients/PatientAdvancedFilter';

export const filterPatients = (
  patients: Patient[], 
  searchTerm: string, 
  filters: PatientFilters
): Patient[] => {
  return patients
    .filter(patient => !patient.deleted_at) // Garantir que não mostramos pacientes deletados
    .filter(patient => {
      const documentNumber = patient.patient_type === 'individual' ? patient.cpf : patient.cnpj || '';
      const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           documentNumber.includes(searchTerm) ||
                           patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.phone?.includes(searchTerm);
      
      const matchesPatientId = !filters.patientId || patient.id === filters.patientId;
      const matchesCpf = !filters.cpfSearch || patient.cpf.includes(filters.cpfSearch);
      const matchesGuardian = !filters.hasGuardian || 
                             (filters.hasGuardian === "true" && patient.has_financial_guardian) ||
                             (filters.hasGuardian === "false" && !patient.has_financial_guardian);
      const matchesFromAbroad = !filters.isFromAbroad ||
                               (filters.isFromAbroad === "true" && patient.is_payment_from_abroad) ||
                               (filters.isFromAbroad === "false" && !patient.is_payment_from_abroad);

      return matchesSearch && matchesPatientId && matchesCpf && matchesGuardian && matchesFromAbroad;
    });
};
