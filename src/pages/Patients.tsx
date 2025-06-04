
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { PatientForm } from "@/components/PatientForm";
import { PatientAdvancedFilter, PatientFilters } from "@/components/patients/PatientAdvancedFilter";

interface Patient {
  id: string;
  full_name: string;
  cpf: string;
  phone?: string;
  email?: string;
  has_financial_guardian: boolean;
  guardian_cpf?: string;
  is_payment_from_abroad: boolean;
}

type SortField = 'full_name' | 'cpf';
type SortDirection = 'asc' | 'desc';

const formatCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return '-';
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const Patients = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<PatientFilters>({
    patientId: "",
    cpfSearch: ""
  });
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!user
  });

  // Filter and sort patients
  const filteredAndSortedPatients = patients?.filter(patient => {
    // Filter by patient
    if (filters.patientId && patient.id !== filters.patientId) {
      return false;
    }
    
    // Filter by CPF search
    if (filters.cpfSearch && patient.cpf) {
      const cleanSearch = filters.cpfSearch.replace(/\D/g, '');
      const cleanCpf = patient.cpf.replace(/\D/g, '');
      if (!cleanCpf.includes(cleanSearch)) {
        return false;
      }
    }
    
    return true;
  })?.sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue, bValue;
    
    if (sortField === 'full_name') {
      aValue = a.full_name.toLowerCase();
      bValue = b.full_name.toLowerCase();
    } else if (sortField === 'cpf') {
      aValue = a.cpf || '';
      bValue = b.cpf || '';
    } else {
      return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir paciente: ' + error.message);
    }
  });

  const handleDelete = (patient: Patient) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente ${patient.full_name}?`)) {
      deleteMutation.mutate(patient.id);
    }
  };

  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPatient(undefined);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPatient(undefined);
  };

  const handleFilterChange = (newFilters: PatientFilters) => {
    setFilters(newFilters);
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
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 mb-6">
          <h1 className="text-3xl font-bold">Pacientes</h1>
          
          {/* Mobile-first responsive button layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:flex-wrap sm:items-center">
            <div className="flex gap-2 order-1 sm:order-1">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none">
                Voltar
              </Button>
            </div>
            
            <div className="flex gap-2 order-3 sm:order-2 sm:ml-auto">
              <PatientAdvancedFilter 
                onFilterChange={handleFilterChange}
                currentFilters={filters}
                patients={patients}
              />
            </div>
            
            <div className="order-2 sm:order-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Paciente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
                    </DialogTitle>
                  </DialogHeader>
                  <PatientForm patient={editingPatient} onClose={closeDialog} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {patientsLoading ? (
            <div className="p-8 text-center">Carregando...</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {filteredAndSortedPatients?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum paciente encontrado
                  </div>
                ) : (
                  filteredAndSortedPatients?.map((patient) => (
                    <Card key={patient.id}>
                      <CardContent className="text-sm p-4">
                        <p><strong>Nome:</strong> {patient.full_name}</p>
                        <p><strong>CPF:</strong> {formatCPF(patient.cpf)}</p>
                        <p><strong>Telefone:</strong> {patient.phone || '-'}</p>
                        <p><strong>Email:</strong> {patient.email || '-'}</p>
                        {patient.is_payment_from_abroad && (
                          <p><strong>Pagamento do exterior:</strong> Sim</p>
                        )}
                        <div className="flex justify-end gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(patient)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(patient)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('full_name')}
                        >
                          Nome Completo {getSortIcon('full_name')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('cpf')}
                        >
                          CPF {getSortIcon('cpf')}
                        </Button>
                      </TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Exterior</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPatients?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Nenhum paciente encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedPatients?.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">{patient.full_name}</TableCell>
                          <TableCell>{formatCPF(patient.cpf)}</TableCell>
                          <TableCell>{patient.phone || '-'}</TableCell>
                          <TableCell>{patient.email || '-'}</TableCell>
                          <TableCell>{patient.is_payment_from_abroad ? 'Sim' : 'Não'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(patient)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(patient)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;
