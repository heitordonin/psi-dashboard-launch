
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagarmeBalance } from "@/hooks/usePagarmeBalance";
import { useEffect } from "react";
import { AlertCircle, DollarSign, Clock, History } from "lucide-react";

const PsicloBankExtrato = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { data: balance, isLoading: balanceLoading, error } = usePagarmeBalance();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100); // Pagar.me returns amounts in cents
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
            <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Extrato</h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>Histórico de movimentações, saldos e saques</p>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-4 py-8">
              {error && (
                <Card className="mb-6 border-red-200 bg-red-50">
                  <CardContent className="flex items-center gap-2 pt-6">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-700">
                      {error.message || 'Erro ao carregar dados financeiros. Verifique se sua conta de pagamento está configurada.'}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Saldo Disponível para Saque */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Saldo Disponível para Saque
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {balanceLoading ? (
                      <Skeleton className="h-8 w-32 mb-2" />
                    ) : (
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {balance ? formatCurrency(balance.available_amount) : 'R$ 0,00'}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mb-4">
                      Valor disponível para transferência
                    </p>
                    <Button 
                      className="w-full" 
                      disabled={!balance || balance.available_amount === 0}
                    >
                      Solicitar Saque
                    </Button>
                  </CardContent>
                </Card>

                {/* Saldo a Receber */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Saldo a Receber
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {balanceLoading ? (
                      <Skeleton className="h-8 w-32 mb-2" />
                    ) : (
                      <div className="text-2xl font-bold text-orange-600 mb-2">
                        {balance ? formatCurrency(balance.waiting_funds_amount) : 'R$ 0,00'}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Valor em processamento
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Histórico de Movimentações */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <CardTitle>Histórico de Movimentações</CardTitle>
                  </div>
                  <CardDescription>
                    Saques e transferências realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      Histórico em desenvolvimento
                    </p>
                    <p className="text-sm">
                      O histórico de saques e transferências aparecerá aqui em breve.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PsicloBankExtrato;
