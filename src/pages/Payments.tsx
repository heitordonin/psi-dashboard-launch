
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
import { PaymentFormWrapper } from "@/components/payments/PaymentFormWrapper";
import { PaymentAdvancedFilter, PaymentFilters } from "@/components/payments/PaymentAdvancedFilter";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { PaymentWithPatient } from "@/types/payment";

type SortField = 'amount' | 'due_date' | 'patient_name' | 'status';
type SortDirection = 'asc' | 'desc';

const Payments = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentWithPatient | undefined>();
  const [deletingPayment, setDeletingPayment] = useState<PaymentWithPatient | undefined>();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<PaymentFilters>({
    patientId: "",
    status: "",
    startDate: "",
    endDate: ""
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      console.log('Payments - Buscando pagamentos para usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients (
            full_name
          )
        `)
        .order('due_date', { ascending: false });
        
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

  // Filter and sort payments with proper null checks
  const filteredAndSortedPayments = payments?.filter(payment => {
    if (!payment) return false;

    if (filters.patientId && payment.patient_id !== filters.patientId) {
      return false;
    }
    
    if (filters.status && payment.status !== filters.status) {
      return false;
    }
    
    if (filters.startDate && payment.due_date < filters.startDate) {
      return false;
    }
    
    if (filters.endDate && payment.due_date > filters.endDate) {
      return false;
    }
    
    return true;
  })?.sort((a, b) => {
    if (!sortField || !a || !b) return 0;
    
    let aValue, bValue;
    
    if (sortField === 'amount') {
      aValue = a.amount;
      bValue = b.amount;
    } else if (sortField === 'due_date') {
      aValue = new Date(a.due_date).getTime();
      bValue = new Date(b.due_date).getTime();
    } else if (sortField === 'patient_name') {
      aValue = a.patients?.full_name?.toLowerCase() || '';
      bValue = b.patients?.full_name?.toLowerCase() || '';
    } else if (sortField === 'status') {
      aValue = a.status;
      bValue = b.status;
    } else {
      return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) || [];

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
      setDeletingPayment(undefined);
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir cobrança: ' + error.message);
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

  const handleDelete = (payment: PaymentWithPatient) => {
    setDeletingPayment(payment);
  };

  const confirmDelete = () => {
    if (deletingPayment) {
      deleteMutation.mutate(deletingPayment.id);
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

  const canEditOrDelete = (payment: PaymentWithPatient) => {
    return payment.status === 'draft' || payment.status === 'paid';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

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
            </div>
            
            <div className="flex gap-2 order-3 sm:order-2 sm:ml-auto">
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
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {filteredAndSortedPayments?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma cobrança encontrada
                  </div>
                ) : (
                  filteredAndSortedPayments?.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="text-sm p-4">
                        <p><strong>Paciente:</strong> {payment.patients?.full_name || '-'}</p>
                        <p><strong>Valor:</strong> {formatCurrency(payment.amount)}</p>
                        <p><strong>Vencimento:</strong> {formatDate(payment.due_date)}</p>
                        <p><strong>Status:</strong> <PaymentStatusBadge status={payment.status} /></p>
                        <p><strong>Descrição:</strong> {payment.description || '-'}</p>
                        {payment.paid_date && (
                          <p><strong>Data do Pagamento:</strong> {formatDate(payment.paid_date)}</p>
                        )}
                        <div className="flex justify-end gap-2 mt-3">
                          {canEditOrDelete(payment) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(payment)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(payment)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('status')}
                        >
                          Status {getSortIcon('status')}
                        </Button>
                      </TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data Pagamento</TableHead>
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
                          <TableCell className="font-medium">
                            {payment.patients?.full_name || '-'}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{formatDate(payment.due_date)}</TableCell>
                          <TableCell>
                            <PaymentStatusBadge status={payment.status} />
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {payment.description || '-'}
                          </TableCell>
                          <TableCell>
                            {payment.paid_date ? formatDate(payment.paid_date) : '-'}
                          </TableCell>
                          <TableCell>
                            {canEditOrDelete(payment) && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(payment)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(payment)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
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

      <DeleteConfirmationDialog
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(undefined)}
        onConfirm={confirmDelete}
        title="Excluir Cobrança"
        description={`Tem certeza que deseja excluir esta cobrança do paciente ${deletingPayment?.patients?.full_name || 'desconhecido'}?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Payments;
