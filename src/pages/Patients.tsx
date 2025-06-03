import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  cpf: string;
  phone?: string;
  email?: string;
  birthdate?: string;
  has_financial_guardian: boolean;
  guardian_cpf?: string;
}

const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  
  // Check for repeated digits
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const PatientForm = ({ patient, onClose }: { patient?: Patient; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    full_name: patient?.full_name || '',
    cpf: patient?.cpf || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    birthdate: patient?.birthdate || '',
    has_financial_guardian: patient?.has_financial_guardian || false,
    guardian_cpf: patient?.guardian_cpf || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Patient, 'id'>) => {
      const { error } = await supabase.from('patients').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente criado com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar paciente: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Omit<Patient, 'id'>) => {
      const { error } = await supabase
        .from('patients')
        .update(data)
        .eq('id', patient!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente atualizado com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar paciente: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }
    
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (formData.has_financial_guardian) {
      if (!formData.guardian_cpf.trim()) {
        newErrors.guardian_cpf = 'CPF do responsável é obrigatório quando há responsável financeiro';
      } else if (!validateCPF(formData.guardian_cpf)) {
        newErrors.guardian_cpf = 'CPF do responsável inválido';
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const cleanData = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone || null,
        email: formData.email || null,
        birthdate: formData.birthdate || null,
        guardian_cpf: formData.has_financial_guardian && formData.guardian_cpf 
          ? formData.guardian_cpf.replace(/\D/g, '') 
          : null
      };
      
      if (patient) {
        updateMutation.mutate(cleanData);
      } else {
        createMutation.mutate(cleanData);
      }
    }
  };

  const handleCPFChange = (value: string, field: 'cpf' | 'guardian_cpf') => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 11) {
      setFormData({ ...formData, [field]: formatCPF(cleanValue) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Nome Completo *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className={errors.full_name ? 'border-red-500' : ''}
        />
        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
      </div>

      <div>
        <Label htmlFor="cpf">CPF *</Label>
        <Input
          id="cpf"
          value={formData.cpf}
          onChange={(e) => handleCPFChange(e.target.value, 'cpf')}
          placeholder="000.000.000-00"
          className={errors.cpf ? 'border-red-500' : ''}
        />
        {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(11) 99999-9999"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="birthdate">Data de Nascimento</Label>
        <Input
          id="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="has_financial_guardian"
            checked={formData.has_financial_guardian}
            onCheckedChange={(checked) => {
              setFormData({ 
                ...formData, 
                has_financial_guardian: checked,
                guardian_cpf: checked ? formData.guardian_cpf : ''
              });
            }}
          />
          <Label htmlFor="has_financial_guardian">Existe um responsável financeiro?</Label>
        </div>
        
        {formData.has_financial_guardian && (
          <div>
            <Label htmlFor="guardian_cpf">CPF do Responsável Financeiro *</Label>
            <Input
              id="guardian_cpf"
              value={formData.guardian_cpf}
              onChange={(e) => handleCPFChange(e.target.value, 'guardian_cpf')}
              placeholder="000.000.000-00"
              className={errors.guardian_cpf ? 'border-red-500' : ''}
            />
            {errors.guardian_cpf && <p className="text-red-500 text-sm mt-1">{errors.guardian_cpf}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {patient ? 'Atualizar' : 'Criar'} Paciente
        </Button>
      </div>
    </form>
  );
};

const Patients = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Patient[];
    }
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Pacientes</h1>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Voltar
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
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

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Nenhum paciente cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.full_name}</TableCell>
                        <TableCell>{formatCPF(patient.cpf)}</TableCell>
                        <TableCell>{patient.phone || '-'}</TableCell>
                        <TableCell>{patient.email || '-'}</TableCell>
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
            )}
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToHome />
      </SignedOut>
    </div>
  );
};

const RedirectToHome = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return null;
};

export default Patients;
