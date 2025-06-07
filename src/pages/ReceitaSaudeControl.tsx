import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Receipt, Search, Copy } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReceitaSaudeAdvancedFilter, ReceitaSaudeFilters } from "@/components/payments/ReceitaSaudeAdvancedFilter";
import { toast } from "sonner";
import type { Payment } from "@/types/payment";

const ReceitaSaudeControl = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ReceitaSaudeFilters>({
    patientId: "",
    startDate: "",
    endDate: "",
    status: "",
    minAmount: "",
    maxAmount: "",
    receiptStatus: "",
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
        .order('paid_date', { ascending: false })
        .order('created_at', { ascending: false }); // Secondary sort for stability
      
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

    const matchesReceiptStatus = (() => {
      if (!filters.receiptStatus) return true;
      if (filters.receiptStatus === "issued") return payment.receita_saude_receipt_issued;
      if (filters.receiptStatus === "not_issued") return !payment.receita_saude_receipt_issued;
      return true;
    })();

    return matchesSearch && matchesPatientId && matchesDateRange && matchesAmountRange && matchesReceiptStatus;
  });

  const handleFilterChange = (newFilters: ReceitaSaudeFilters) => {
    setFilters(newFilters);
  };

  const handleReceiptToggle = (paymentId: string, currentStatus: boolean) => {
    // Optimistic update to prevent order change
    queryClient.setQueryData(['payments-receita-saude', user?.id], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((payment: any) => 
        payment.id === paymentId 
          ? { ...payment, receita_saude_receipt_issued: !currentStatus }
          : payment
      );
    });
    
    updateReceiptMutation.mutate({ paymentId, issued: !currentStatus });
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${fieldName} copiado!`);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
                    <ReceitaSaudeAdvancedFilter
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
                        {searchTerm || filters.patientId || filters.startDate || filters.endDate || filters.minAmount || filters.maxAmount || filters.receiptStatus
                          ? 'Nenhum pagamento encontrado com os filtros aplicados' 
                          : 'Nenhum pagamento pago encontrado'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y">
                      {filteredPayments.map((payment) => {
                        const payerCpf = payment.payer_cpf || payment.patients?.cpf;
                        const patientCpf = payment.patients?.cpf;
                        const isDifferentPayer = payment.payer_cpf && payment.payer_cpf !== patientCpf;
                        const paymentDate = new Date(payment.paid_date || payment.due_date).toLocaleDateString('pt-BR');
                        const formattedAmount = `R$ ${Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                        
                        return (
                          <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Primeira coluna - Informações básicas */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-500 text-sm">Data:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900 font-mono">{paymentDate}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(paymentDate, 'Data')}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-500 text-sm">Paciente:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900 truncate max-w-[200px]">
                                      {payment.patients?.full_name || 'Paciente não encontrado'}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(payment.patients?.full_name || '', 'Nome do paciente')}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-500 text-sm">CPF Paciente:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900 font-mono">
                                      {patientCpf ? formatCpf(patientCpf) : 'N/A'}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(patientCpf || '', 'CPF do paciente')}
                                      className="h-6 w-6 p-0"
                                      disabled={!patientCpf}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                {isDifferentPayer && (
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-500 text-sm">CPF Titular:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-600 font-mono">
                                        {formatCpf(payment.payer_cpf!)}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(payment.payer_cpf!, 'CPF do titular')}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Segunda coluna - Valor e controles */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-500 text-sm">Valor:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900 font-semibold font-mono">
                                      {formattedAmount}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(Number(payment.amount).toFixed(2).replace('.', ','), 'Valor')}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                {payment.description && (
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-500 text-sm">Descrição:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-600 text-sm truncate max-w-[200px]">
                                        {payment.description}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(payment.description!, 'Descrição')}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-end mt-4">
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
                            </div>

                            {isDifferentPayer && (
                              <div className="mt-3 p-2 bg-blue-50 rounded-md">
                                <p className="text-xs text-blue-700">
                                  ⚠️ Pagamento realizado por titular diferente do paciente
                                </p>
                              </div>
                            )}
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
