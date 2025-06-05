import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, User, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientForm } from "@/components/PatientForm";
import { PatientAdvancedFilter } from "@/components/patients/PatientAdvancedFilter";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";
import type { Patient } from "@/types/patient";

const Patients = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [filters, setFilters] = useState({
    ageRange: { min: "", max: "" },
    guardianRequired: ""
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente excluído com sucesso!');
      setDeletePatient(null);
    },
    onError: (error) => {
      console.error('Error deleting patient:', error);
      toast.error('Erro ao excluir paciente');
    }
  });

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAgeRange = (() => {
      if (!filters.ageRange.min && !filters.ageRange.max) return true;
      if (!patient.birth_date) return false;
      
      const age = new Date().getFullYear() - new Date(patient.birth_date).getFullYear();
      const minAge = filters.ageRange.min ? parseInt(filters.ageRange.min) : 0;
      const maxAge = filters.ageRange.max ? parseInt(filters.ageRange.max) : 150;
      
      return age >= minAge && age <= maxAge;
    })();

    const matchesGuardianRequired = filters.guardianRequired === "" || 
                                   (filters.guardianRequired === "yes" && patient.guardian_name) ||
                                   (filters.guardianRequired === "no" && !patient.guardian_name);

    return matchesSearch && matchesAgeRange && matchesGuardianRequired;
  });

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    setDeletePatient(patient);
  };

  const confirmDelete = () => {
    if (deletePatient) {
      deletePatientMutation.mutate(deletePatient.id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPatient(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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
            {/* Header */}
            <div className="bg-indigo-700 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white hover:bg-indigo-600" />
                  <div>
                    <h1 className="text-xl font-semibold text-white">Pacientes</h1>
                    <p className="text-sm text-indigo-100">Gerencie seus pacientes</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-white text-indigo-700 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Paciente
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por nome, CPF ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="sm:w-auto"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                    </Button>
                  </div>

                  {showFilters && (
                    <div className="mt-4 pt-4 border-t">
                      <PatientAdvancedFilter
                        filters={filters}
                        onFiltersChange={setFilters}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Patients List */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {patientsLoading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando pacientes...</p>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {searchTerm || Object.values(filters).some(f => f) 
                        ? 'Nenhum paciente encontrado com os filtros aplicados' 
                        : 'Nenhum paciente cadastrado'
                      }
                    </p>
                    <Button onClick={() => setShowForm(true)} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar primeiro paciente
                    </Button>
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <Card key={patient.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{patient.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          {patient.cpf && <p>CPF: {patient.cpf}</p>}
                          {patient.phone && <p>Telefone: {patient.phone}</p>}
                          {patient.birth_date && (
                            <p>Idade: {new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} anos</p>
                          )}
                          {patient.guardian_name && <p>Responsável: {patient.guardian_name}</p>}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditPatient(patient)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeletePatient(patient)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
                    </h2>
                    <PatientForm
                      patient={editingPatient}
                      onSave={handleFormClose}
                      onCancel={handleFormClose}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation */}
            <DeleteConfirmationDialog
              isOpen={!!deletePatient}
              onClose={() => setDeletePatient(null)}
              onConfirm={confirmDelete}
              title="Excluir Paciente"
              description={`Tem certeza de que deseja excluir o paciente "${deletePatient?.name}"? Esta ação não pode ser desfeita.`}
              isLoading={deletePatientMutation.isPending}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Patients;
