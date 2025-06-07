
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Receipt, Search } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentAdvancedFilter, PaymentFilters } from "@/components/payments/PaymentAdvancedFilter";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";
import type { Payment } from "@/types/payment";

const ReceitaSaudeControl = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
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
    queryKey: ['payments-receita-saude', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients (
            full_name,
            cpf
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'paid')
        .order('paid_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const updateReceiptMutation = useMutation({
    mutationFn: async ({ paymentId, issued }: { paymentId: string; issued: boolean }) => {
      const { error } = await supabase
        .from('payments')
        .update({ receita_saude_receipt_issued: issued })
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-receita-saude'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Status do recibo atualizado!');
    },
    onError: (error) => {
      console.error('Error updating receipt status:', error);
      toast.error('Erro ao atualizar status do recibo');
    }
  });

  const filteredPayments = payments.filter(payment => {
    const patientName = payment.patients?.full_name || '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.patients?.cpf?.includes(searchTerm);
    
    const matchesPatientId = !filters.patientId || payment.patient_id === filters.patientId;
    
    const matchesDateRange = (() => {
      if (!filters.startDate && !filters.endDate) return true;
      const paymentDate = new Date(payment.paid_date || payment.due_date);
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

    return matchesSearch && matchesPatientId && matchesDateRange && matchesAmountRange;
  });

  const handleFilterChange = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
  };

  const handleReceiptToggle = (paymentId: string, currentStatus: boolean) => {
    updateReceiptMutation.mutate({ paymentId, issued: !currentStatus });
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
            {/* Header */}
            <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Controle Receita Saúde</h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>Controle de recibos emitidos no Receita Saúde</p>
                </div>
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
                        placeholder="Buscar por paciente, CPF ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <PaymentAdvancedFilter
                      currentFilters={filters}
                      onFilterChange={handleFilterChange}
                      patients={patients}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payments List */}
              <Card>
                <CardContent className="p-0">
                  {paymentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Carregando pagamentos...</p>
                    </div>
                  ) : filteredPayments.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {searchTerm || filters.patientId || filters.startDate || filters.endDate || filters.minAmount || filters.maxAmount
                          ? 'Nenhum pagamento encontrado com os filtros aplicados' 
                          : 'Nenhum pagamento pago encontrado'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y">
                      {filteredPayments.map((payment) => {
                        const payerCpf = payment.payer_cpf || payment.patients?.cpf;
                        return (
                          <div key={payment.id} className="flex justify-between items-start p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="font-medium text-gray-500">Data:</span>
                                  <p className="text-gray-900">
                                    {new Date(payment.paid_date || payment.due_date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Paciente:</span>
                                  <p className="text-gray-900 truncate">
                                    {payment.patients?.full_name || 'Paciente não encontrado'}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">CPF Titular:</span>
                                  <p className="text-gray-900">
                                    {payerCpf || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Valor:</span>
                                  <p className="text-gray-900 font-semibold">
                                    R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                              {payment.description && (
                                <div className="mt-2">
                                  <span className="font-medium text-gray-500 text-sm">Descrição:</span>
                                  <p className="text-gray-600 text-sm truncate">{payment.description}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`receipt-${payment.id}`}
                                  checked={payment.receita_saude_receipt_issued}
                                  onCheckedChange={() => handleReceiptToggle(payment.id, payment.receita_saude_receipt_issued)}
                                  disabled={updateReceiptMutation.isPending}
                                />
                                <label 
                                  htmlFor={`receipt-${payment.id}`}
                                  className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                  Recibo emitido
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ReceitaSaudeControl;
