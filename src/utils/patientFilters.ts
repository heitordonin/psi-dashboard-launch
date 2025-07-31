
import type { Patient } from '@/types/patient';
import { PatientFilters } from '@/components/patients/PatientAdvancedFilter';

export const filterPatients = (
  patients: Patient[], 
  searchTerm: string, 
  filters: PatientFilters
): Patient[] => {
  try {
    return patients
      .filter(patient => !patient.deleted_at) // Garantir que não mostramos pacientes deletados
      .filter(patient => {
        try {
          // Safe document number check
          const documentNumber = patient.patient_type === 'individual' 
            ? (patient.cpf || '') 
            : (patient.cnpj || '');
          
          // Safe search term matching with null checks
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = !searchTerm || (
            patient.full_name?.toLowerCase().includes(searchLower) ||
            documentNumber.includes(searchTerm) ||
            (patient.email && patient.email.toLowerCase().includes(searchLower)) ||
            (patient.phone && patient.phone.includes(searchTerm))
          );
          
          const matchesPatientId = !filters.patientId || patient.id === filters.patientId;
          
          // Safe CPF filter check
          const matchesCpf = !filters.cpfSearch || (patient.cpf && patient.cpf.includes(filters.cpfSearch));
          
          const matchesGuardian = !filters.hasGuardian || 
                                 (filters.hasGuardian === "true" && patient.has_financial_guardian) ||
                                 (filters.hasGuardian === "false" && !patient.has_financial_guardian);
          
          const matchesFromAbroad = !filters.isFromAbroad ||
                                   (filters.isFromAbroad === "true" && patient.is_payment_from_abroad) ||
                                   (filters.isFromAbroad === "false" && !patient.is_payment_from_abroad);

          return matchesSearch && matchesPatientId && matchesCpf && matchesGuardian && matchesFromAbroad;
        } catch (error) {
          console.warn('Error filtering patient:', patient.id, error);
          return false; // Exclude problematic patient from results
        }
      });
  } catch (error) {
    console.error('Error in filterPatients:', error);
    return patients.filter(patient => !patient.deleted_at); // Return unfiltered list as fallback
  }
};
