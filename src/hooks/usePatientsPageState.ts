
import { useState } from 'react';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { PatientFilters } from '@/components/patients/PatientAdvancedFilter';
import type { Patient } from '@/types/patient';

export const usePatientsPageState = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [filters, setFilters] = useState<PatientFilters>({
    patientId: "",
    cpfSearch: "",
    hasGuardian: "",
    isFromAbroad: "",
  });
  
  const { patientLimit } = useSubscription();

  const handleFilterChange = (newFilters: PatientFilters) => {
    setFilters(newFilters);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowWizard(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    setDeletePatient(patient);
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    setEditingPatient(null);
  };

  const handleNewPatient = (patientCount: number) => {
    // Check patient limit before allowing new patient creation
    if (patientLimit !== null && patientCount >= patientLimit) {
      toast.error(`Você atingiu o limite de ${patientLimit} pacientes do seu plano atual. Faça upgrade para adicionar mais pacientes.`);
      return;
    }
    setEditingPatient(null); // Ensure we're in creation mode
    setShowWizard(true);
  };

  return {
    searchTerm,
    setSearchTerm,
    showWizard,
    editingPatient,
    deletePatient,
    setDeletePatient,
    filters,
    handleFilterChange,
    handleEditPatient,
    handleDeletePatient,
    handleWizardClose,
    handleNewPatient,
  };
};
