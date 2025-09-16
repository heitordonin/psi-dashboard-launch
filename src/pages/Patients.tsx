import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { CreatePatientWizard } from "@/components/patients/CreatePatientWizard";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PatientsHeader } from "@/components/patients/PatientsHeader";
import { PatientSidebar } from "@/components/patients/PatientSidebar";
import { PatientDetails } from "@/components/patients/PatientDetails";
import { usePatientsData } from "@/hooks/usePatientsData";
import { usePatientsPageState } from "@/hooks/usePatientsPageState";
import { usePatientDetailsState } from "@/hooks/usePatientDetailsState";
import { usePatientCharges } from "@/hooks/usePatientCharges";
import { useIsMobile } from "@/hooks/use-mobile";

const Patients = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  
  const {
    patients,
    patientCount,
    patientsLoading,
    deletePatientMutation
  } = usePatientsData();

  const {
    showWizard,
    editingPatient,
    deletePatient,
    setDeletePatient,
    handleEditPatient,
    handleDeletePatient,
    handleWizardClose,
    handleNewPatient,
  } = usePatientsPageState();

  const {
    selectedPatient,
    filteredPatients,
    searchTerm,
    setSearchTerm,
    handlePatientSelect,
    selectedPatientId
  } = usePatientDetailsState(patients);

  const { charges, isLoading: chargesLoading } = usePatientCharges(user?.id, selectedPatientId);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const confirmDelete = () => {
    if (deletePatient) {
      deletePatientMutation.mutate(deletePatient.id);
      setDeletePatient(null);
    }
  };

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

            <div className="flex h-[calc(100vh-64px)] gap-4 p-4">
              {/* Left Panel - Patient List */}
              <div className={`${isMobile ? 'w-full' : 'w-[30%]'} ${isMobile && selectedPatient ? 'hidden' : ''}`}>
                <PatientSidebar
                  patients={filteredPatients}
                  isLoading={patientsLoading}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedPatientId={selectedPatientId}
                  onPatientSelect={handlePatientSelect}
                  onNewPatient={() => handleNewPatient(patientCount)}
                />
              </div>

              {/* Right Panel - Patient Details */}
              <div className={`${isMobile ? 'w-full' : 'w-[70%]'} ${isMobile && !selectedPatient ? 'hidden' : ''}`}>
                <PatientDetails
                  patient={selectedPatient}
                  charges={charges}
                  isLoading={chargesLoading}
                  onEditPatient={() => selectedPatient && handleEditPatient(selectedPatient)}
                />
              </div>
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
