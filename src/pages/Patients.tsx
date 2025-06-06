
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionDropdown } from "@/components/ui/action-dropdown";
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
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hasGuardian: "",
    isFromAbroad: "",
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
        .order('created_at', { ascending: false });
      
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
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.cpf.includes(searchTerm) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone?.includes(searchTerm);
    
    const matchesGuardian = filters.hasGuardian === "" || 
      (filters.hasGuardian === "true" && patient.has_financial_guardian) ||
      (filters.hasGuardian === "false" && !patient.has_financial_guardian);

    const matchesAbroad = filters.isFromAbroad === "" || 
      (filters.isFromAbroad === "true" && patient.is_payment_from_abroad) ||
      (filters.isFromAbroad === "false" && !patient.is_payment_from_abroad);

    return matchesSearch && matchesGuardian && matchesAbroad;
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
            {/* Header */}
            <div className="bg-psiclo-primary px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white hover:bg-psiclo-secondary" />
                  <div>
                    <h1 className="text-xl font-semibold text-white">Pacientes</h1>
                    <p className="text-sm text-psiclo-accent">Gerencie seus pacientes</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-white text-psiclo-primary hover:bg-gray-100"
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
                        placeholder="Buscar por nome, CPF, email ou telefone..."
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
                        currentFilters={filters}
                        onFilterChange={setFilters}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Patients List */}
              <Card>
                <CardContent className="p-0">
                  {patientsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-psiclo-primary mx-auto"></div>
                      <p className="mt-4 text-gray-600">Carregando pacientes...</p>
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                    <div className="flex flex-col divide-y">
                      {filteredPatients.map((patient) => (
                        <div key={patient.id} className="flex justify-between items-start p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{patient.full_name}</p>
                            <p className="text-xs text-gray-600 mt-1">CPF: {patient.cpf}</p>
                            {patient.email && (
                              <p className="text-xs text-gray-600">Email: {patient.email}</p>
                            )}
                            {patient.phone && (
                              <p className="text-xs text-gray-600">Telefone: {patient.phone}</p>
                            )}
                            {patient.has_financial_guardian && (
                              <p className="text-xs text-green-600 mt-1">Possui responsável financeiro</p>
                            )}
                            {patient.is_payment_from_abroad && (
                              <p className="text-xs text-blue-600 mt-1">Pagamento do exterior</p>
                            )}
                          </div>
                          <ActionDropdown
                            onEdit={() => handleEditPatient(patient)}
                            onDelete={() => handleDeletePatient(patient)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
                      onClose={handleFormClose}
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
