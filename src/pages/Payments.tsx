import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CreditCard, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentFormWrapper } from "@/components/payments/PaymentFormWrapper";
import { PaymentAdvancedFilter } from "@/components/payments/PaymentAdvancedFilter";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { PaymentButtons } from "@/components/payments/PaymentButtons";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";
import type { PaymentWithPatient } from "@/types/payment";

const Payments = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentWithPatient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deletePayment, setDeletePayment] = useState<PaymentWithPatient | null>(null);
  const [filters, setFilters] = useState({
    patientId: "",
    startDate: "",
    endDate: "",
    status: ""
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients (
            full_name
          )
        `)
        .eq('owner_id', user.id)
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return data as PaymentWithPatient[];
    },
    enabled: !!user?.id
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('owner_id', user.id)
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança excluída com sucesso!');
      setDeletePayment(null);
    },
    onError: (error) => {
      console.error('Error deleting payment:', error);
      toast.error('Erro ao excluir cobrança');
    }
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança marcada como paga!');
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error('Erro ao atualizar cobrança');
    }
  });

  const filteredPayments = payments.filter(payment => {
    const patientName = payment.patients?.full_name || '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.guardian_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === "" || payment.status === filters.status;
    const matchesPatient = filters.patientId === "" || payment.patient_id === filters.patientId;
    
    const matchesDateRange = (() => {
      if (!filters.startDate && !filters.endDate) return true;
      const paymentDate = new Date(payment.due_date);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      if (startDate && paymentDate < startDate) return false;
      if (endDate && paymentDate > endDate) return false;
      return true;
    })();

    return matchesSearch && matchesStatus && matchesPatient && matchesDateRange;
  });

  const handleEditPayment = (payment: PaymentWithPatient) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleDeletePayment = (payment: PaymentWithPatient) => {
    setDeletePayment(payment);
  };

  const handleMarkAsPaid = (payment: PaymentWithPatient) => {
    markAsPaidMutation.mutate(payment.id);
  };

  const confirmDelete = () => {
    if (deletePayment) {
      deletePaymentMutation.mutate(deletePayment.id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPayment(null);
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
                    <h1 className="text-xl font-semibold text-white">Cobranças</h1>
                    <p className="text-sm text-indigo-100">Gerencie suas cobranças</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-white text-indigo-700 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Cobrança
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
                        placeholder="Buscar por paciente, descrição ou responsável..."
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
                      <PaymentAdvancedFilter
                        currentFilters={filters}
                        onFilterChange={setFilters}
                        patients={patients}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payments List */}
              <Card>
                <CardContent className="p-0">
                  {paymentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Carregando cobranças...</p>
                    </div>
                  ) : filteredPayments.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {searchTerm || Object.values(filters).some(f => f) 
                          ? 'Nenhuma cobrança encontrada com os filtros aplicados' 
                          : 'Nenhuma cobrança cadastrada'
                        }
                      </p>
                      <Button onClick={() => setShowForm(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar primeira cobrança
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y">
                      {filteredPayments.map((payment) => (
                        <div key={payment.id} className="flex justify-between items-start p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {payment.patients?.full_name || 'Paciente não encontrado'}
                            </p>
                            {payment.guardian_name && (
                              <p className="text-xs text-gray-500 truncate">Resp: {payment.guardian_name}</p>
                            )}
                            {payment.description && (
                              <p className="text-xs text-gray-600 truncate mt-1">{payment.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <PaymentStatusBadge status={payment.status} />
                            </div>
                            <ActionDropdown
                              onEdit={() => handleEditPayment(payment)}
                              onDelete={() => handleDeletePayment(payment)}
                              onMarkAsPaid={payment.status !== 'paid' ? () => handleMarkAsPaid(payment) : undefined}
                              showMarkAsPaid={payment.status !== 'paid'}
                            />
                          </div>
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
                      {editingPayment ? 'Editar Cobrança' : 'Nova Cobrança'}
                    </h2>
                    <PaymentFormWrapper
                      payment={editingPayment}
                      onSave={handleFormClose}
                      onCancel={handleFormClose}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation */}
            <DeleteConfirmationDialog
              isOpen={!!deletePayment}
              onClose={() => setDeletePayment(null)}
              onConfirm={confirmDelete}
              title="Excluir Cobrança"
              description={`Tem certeza de que deseja excluir esta cobrança? Esta ação não pode ser desfeita.`}
              isLoading={deletePaymentMutation.isPending}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Payments;
