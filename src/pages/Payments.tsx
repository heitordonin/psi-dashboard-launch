
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Info, Settings, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import PaymentFormWrapper from "@/components/payments/PaymentFormWrapper";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { PaymentWithPatient } from "@/types/payment";
import { InvoiceDescriptionsManager } from "@/components/InvoiceDescriptionsManager";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { PaymentAdvancedFilter, PaymentFilters } from "@/components/payments/PaymentAdvancedFilter";

type SortField = 'amount' | 'due_date' | 'patient_name';
type SortDirection = 'asc' | 'desc';

const Payments = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDescriptionsOpen, setIsDescriptionsOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentWithPatient | undefined>();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<PaymentFilters>({
    patientId: "",
    startDate: "",
    endDate: "",
    status: ""
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      console.log('Payments - Buscando pagamentos para usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients!inner(full_name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Payments - Erro ao buscar pagamentos:', error);
        throw error;
      }
      
      console.log('Payments - Pagamentos encontrados:', data);
      return data as PaymentWithPatient[];
    },
    enabled: !!user,
    retry: 1
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Filter and sort payments
  const filteredAndSortedPayments = payments?.filter(payment => {
    // Filter by patient
    if (filters.patientId && payment.patient_id !== filters.patientId) {
      return false;
    }
    
    // Filter by date range
    if (filters.startDate && payment.due_date < filters.startDate) {
      return false;
    }
    
    if (filters.endDate && payment.due_date > filters.endDate) {
      return false;
    }
    
    // Filter by status
    if (filters.status && payment.status !== filters.status) {
      return false;
    }
    
    return true;
  })?.sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue, bValue;
    
    if (sortField === 'amount') {
      aValue = a.amount;
      bValue = b.amount;
    } else if (sortField === 'due_date') {
      aValue = new Date(a.due_date).getTime();
      bValue = new Date(b.due_date).getTime();
    } else if (sortField === 'patient_name') {
      aValue = a.patients.full_name.toLowerCase();
      bValue = b.patients.full_name.toLowerCase();
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
      console.log('Payments - Deletando pagamento:', id);
      
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) {
        console.error('Payments - Erro ao deletar:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir cobrança: ' + error.message);
    }
  });

  const handleDelete = (payment: PaymentWithPatient) => {
    if (window.confirm(`Tem certeza que deseja excluir a cobrança de ${payment.patients.full_name}?`)) {
      deleteMutation.mutate(payment.id);
    }
  };

  const openEditDialog = (payment: PaymentWithPatient) => {
    setEditingPayment(payment);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPayment(undefined);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPayment(undefined);
  };

  const handleFilterChange = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const canEdit = (status: string) => status === 'draft' || status === 'pending';
  const canDelete = (status: string) => status === 'draft';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 mb-6">
          <h1 className="text-3xl font-bold">Cobranças</h1>
          
          {/* Mobile-first responsive button layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:flex-wrap sm:items-center">
            <div className="flex gap-2 order-1 sm:order-1">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none">
                Voltar
              </Button>
              <LogoutButton />
            </div>
            
            <div className="flex gap-2 order-3 sm:order-2 sm:ml-auto">
              <Button 
                variant="outline" 
                onClick={() => setIsDescriptionsOpen(true)}
                className="flex-1 sm:flex-none"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Descrições padrão</span>
                <span className="sm:hidden">Descrições</span>
              </Button>
              
              <PaymentAdvancedFilter 
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
                    Nova Cobrança
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPayment ? 'Editar Cobrança' : 'Nova Cobrança'}
                    </DialogTitle>
                  </DialogHeader>
                  <PaymentFormWrapper payment={editingPayment} onClose={closeDialog} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort('patient_name')}
                      >
                        Paciente {getSortIcon('patient_name')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort('amount')}
                      >
                        Valor {getSortIcon('amount')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort('due_date')}
                      >
                        Vencimento {getSortIcon('due_date')}
                      </Button>
                    </TableHead>
                    <TableHead>Data Recebimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedPayments?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhuma cobrança encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedPayments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.patients.full_name}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{formatDate(payment.due_date)}</TableCell>
                        <TableCell>
                          {payment.paid_date ? formatDate(payment.paid_date) : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{payment.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PaymentStatusBadge status={payment.status} />
                            {payment.status === 'draft' && (
                              <div className="group relative">
                                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  Cobrança salva. Envio ao paciente será habilitado em breve.
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(payment)}
                              disabled={!canEdit(payment.status)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(payment)}
                              disabled={!canDelete(payment.status) || deleteMutation.isPending}
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
          )}
        </div>
      </div>

      <InvoiceDescriptionsManager 
        isOpen={isDescriptionsOpen}
        onClose={() => setIsDescriptionsOpen(false)}
      />
    </div>
  );
};

export default Payments;
