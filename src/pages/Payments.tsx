import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PaymentFormWrapper } from "@/components/payments/PaymentFormWrapper";
import { PaymentAdvancedFilter, PaymentFilters } from "@/components/payments/PaymentAdvancedFilter";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PaymentsHeader } from "@/components/payments/PaymentsHeader";
import { PaymentsSearchFilter } from "@/components/payments/PaymentsSearchFilter";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { toast } from "sonner";
import type { Payment } from "@/types/payment";

const Payments = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({
    patientId: "",
    startDate: "",
    endDate: "",
    status: "",
    minAmount: "",
    maxAmount: "",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('owner_id', user.id)
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients (
            full_name,
            cpf,
            phone,
            email
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
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
      setDeletePaymentId(null);
    },
    onError: (error) => {
      console.error('Error deleting payment:', error);
      toast.error('Erro ao excluir cobrança');
    }
  });

  const filteredPayments = payments.filter(payment => {
    const patientName = payment.patients?.full_name || '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.patients?.cpf?.includes(searchTerm);
    
    const matchesPatientId = !filters.patientId || payment.patient_id === filters.patientId;
    const matchesStatus = !filters.status || payment.status === filters.status;
    
    const matchesDateRange = (() => {
      if (!filters.startDate && !filters.endDate) return true;
      const paymentDate = new Date(payment.due_date);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      if (startDate && paymentDate < startDate) return false;
      if (endDate && paymentDate > endDate) return false;
      return true;
    })();

    const matchesAmountRange = (() => {
      if (!filters.minAmount && !filters.maxAmount) return true;
      const amount = Number(payment.amount);
      const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
      const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : null;

      if (minAmount && amount < minAmount) return false;
      if (maxAmount && amount > maxAmount) return false;
      return true;
    })();

    return matchesSearch && matchesPatientId && matchesStatus && matchesDateRange && matchesAmountRange;
  });

  const hasFilters = searchTerm || filters.patientId || filters.status || filters.startDate || filters.endDate || filters.minAmount || filters.maxAmount;

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleDeletePayment = (paymentId: string) => {
    setDeletePaymentId(paymentId);
  };

  const confirmDelete = () => {
    if (deletePaymentId) {
      deletePaymentMutation.mutate(deletePaymentId);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  const handleNewPayment = () => {
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
            <PaymentsHeader onNewPayment={handleNewPayment} />

            <div className="container mx-auto px-2 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6 overflow-x-hidden">
              <PaymentsSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFilterChange={setFilters}
                patients={patients}
              />

              <PaymentsList
                payments={filteredPayments}
                isLoading={paymentsLoading}
                hasFilters={!!hasFilters}
                onEdit={handleEditPayment}
                onDelete={handleDeletePayment}
                onNewPayment={handleNewPayment}
              />
            </div>

            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
                <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto mx-2">
                  <div className="p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-4">
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

            <DeleteConfirmationDialog
              isOpen={!!deletePaymentId}
              onClose={() => setDeletePaymentId(null)}
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
