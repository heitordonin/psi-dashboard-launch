
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { CreatePatientWizard } from "@/components/patients/CreatePatientWizard";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PatientsHeader } from "@/components/patients/PatientsHeader";
import { PatientsSearchFilter } from "@/components/patients/PatientsSearchFilter";
import { PatientsList } from "@/components/patients/PatientsList";
import { usePatientsData } from "@/hooks/usePatientsData";
import { usePatientsPageState } from "@/hooks/usePatientsPageState";
import { filterPatients } from "@/utils/patientFilters";

const Patients = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  const {
    patients,
    patientCount,
    patientsLoading,
    deletePatientMutation
  } = usePatientsData();

  const {
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
  } = usePatientsPageState();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const filteredPatients = filterPatients(patients, searchTerm, filters);

  const confirmDelete = () => {
    if (deletePatient) {
      deletePatientMutation.mutate(deletePatient.id);
      setDeletePatient(null);
    }
  };

  const hasActiveFilters = filters.patientId || filters.cpfSearch || filters.hasGuardian || filters.isFromAbroad;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-psiclo-primary"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            <PatientsHeader onNewPatient={() => handleNewPatient(patientCount)} />

            <div className="container mx-auto px-4 py-6 space-y-6">
              <PatientsSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFilterChange={handleFilterChange}
                patients={patients}
              />

              <PatientsList
                patients={filteredPatients}
                isLoading={patientsLoading}
                searchTerm={searchTerm}
                hasActiveFilters={hasActiveFilters}
                onEditPatient={handleEditPatient}
                onDeletePatient={handleDeletePatient}
                onNewPatient={() => handleNewPatient(patientCount)}
              />
            </div>

            {showWizard && (
              <CreatePatientWizard 
                onClose={handleWizardClose} 
                patientToEdit={editingPatient}
              />
            )}

            <DeleteConfirmationDialog
              isOpen={!!deletePatient}
              onClose={() => setDeletePatient(null)}
              onConfirm={confirmDelete}
              title="Excluir Paciente"
              description={`Tem certeza de que deseja excluir o paciente "${deletePatient?.full_name}"? Esta ação não pode ser desfeita.`}
              isLoading={deletePatientMutation.isPending}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Patients;
