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
import { useMobilePatientNavigation } from "@/hooks/useMobilePatientNavigation";
import type { Patient } from "@/types/patient";

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
    showWizard,
    editingPatient,
    deletePatient,
    setDeletePatient,
    handleEditPatient,
    handleDeletePatient,
    handleWizardClose,
    handleNewPatient,
  } = usePatientsPageState();

  const { isMobile, showingDetails, showPatientList, showPatientDetails } = useMobilePatientNavigation();

  const {
    selectedPatient,
    filteredPatients,
    searchTerm,
    setSearchTerm,
    handlePatientSelect,
    selectedPatientId
  } = usePatientDetailsState(patients, isMobile);

  // Enhanced patient select handler for mobile
  const enhancedPatientSelect = (patient: Patient) => {
    handlePatientSelect(patient);
    if (isMobile) {
      showPatientDetails();
    }
  };

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
              {/* Desktop Layout */}
              {!isMobile && (
                <>
                  {/* Left Panel - Patient List */}
                  <div className="w-[30%]">
                    <PatientSidebar
                      patients={filteredPatients}
                      isLoading={patientsLoading}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      selectedPatientId={selectedPatientId}
                      onPatientSelect={enhancedPatientSelect}
                      onNewPatient={() => handleNewPatient(patientCount)}
                    />
                  </div>

                  {/* Right Panel - Patient Details */}
                  <div className="w-[70%]">
                    <PatientDetails
                      patient={selectedPatient}
                      charges={charges}
                      isLoading={chargesLoading}
                      onEditPatient={() => selectedPatient && handleEditPatient(selectedPatient)}
                    />
                  </div>
                </>
              )}

              {/* Mobile Layout */}
              {isMobile && (
                <>
                  {/* Patient List View */}
                  <div className={`w-full transition-transform duration-300 ${showingDetails ? '-translate-x-full absolute' : 'translate-x-0'}`}>
                    <PatientSidebar
                      patients={filteredPatients}
                      isLoading={patientsLoading}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      selectedPatientId={selectedPatientId}
                      onPatientSelect={enhancedPatientSelect}
                      onNewPatient={() => handleNewPatient(patientCount)}
                    />
                  </div>

                  {/* Patient Details View */}
                  <div className={`w-full transition-transform duration-300 ${showingDetails ? 'translate-x-0' : 'translate-x-full absolute'}`}>
                    <PatientDetails
                      patient={selectedPatient}
                      charges={charges}
                      isLoading={chargesLoading}
                      onEditPatient={() => selectedPatient && handleEditPatient(selectedPatient)}
                      onBack={showPatientList}
                    />
                  </div>
                </>
              )}
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
