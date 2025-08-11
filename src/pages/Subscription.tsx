import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionStatusBadge } from "@/components/plans/SubscriptionStatusBadge";

const Subscription = () => {
  const { currentPlan, userSubscription, isLoading, isCancelledAtPeriodEnd } = useSubscription();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isForcingSyncSubscription, setIsForcingSyncSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const { toast } = useToast();

  const refreshSubscriptionStatus = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-stripe-subscription');
      
      if (error) throw error;
      
      setSubscriptionData(data);
      toast({
        title: "Status atualizado",
        description: "As informações da assinatura foram atualizadas.",
      });
      
      // Recarregar a página para atualizar os dados
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status da assinatura.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const forceSubscriptionSync = async () => {
    setIsForcingSyncSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('force-subscription-sync', {
        body: { userId: (await supabase.auth.getUser()).data.user?.id }
      });
      
      if (error) throw error;
      
      toast({
        title: "Sincronização forçada",
        description: "As informações da assinatura foram sincronizadas com o Stripe.",
      });
      
      // Recarregar a página para atualizar os dados
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error forcing subscription sync:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Stripe.",
        variant: "destructive",
      });
    } finally {
      setIsForcingSyncSubscription(false);
    }
  };

  const openCustomerPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro ao abrir portal",
        description: "Não foi possível abrir o portal de gerenciamento.",
        variant: "destructive",
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };


  const getPlanPrice = () => {
    if (!currentPlan) return 'Gratuito';
    
    if (currentPlan.slug === 'free') return 'Gratuito';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(currentPlan.price_monthly) + '/mês';
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p>Carregando informações da assinatura...</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
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
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                    Minha Assinatura
                  </h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>
                    Gerencie sua assinatura e pagamentos
                  </p>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <div className="grid gap-6">
                {/* Card Principal da Assinatura */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Plano Atual
                        </CardTitle>
                        <CardDescription>
                          Informações sobre sua assinatura ativa
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshSubscriptionStatus}
                          disabled={isRefreshing}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                          Atualizar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Plano:</span>
                        <div className="flex items-center gap-2">
                          <span>{currentPlan?.name || 'Plano Gratuito'}</span>
                          <SubscriptionStatusBadge 
                            status={userSubscription?.status || 'active'}
                            cancelAtPeriodEnd={isCancelledAtPeriodEnd}
                            expiresAt={userSubscription?.expires_at}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Valor:</span>
                        <span className="text-lg font-semibold">{getPlanPrice()}</span>
                      </div>

                      {userSubscription?.expires_at && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {isCancelledAtPeriodEnd ? 'Acesso até:' : 'Próximo pagamento:'}
                          </span>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{formatDate(userSubscription.expires_at)}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-medium">Limite de pacientes:</span>
                        <span>
                          {currentPlan?.max_patients || 'Ilimitado'}
                          {currentPlan?.max_patients && ' pacientes'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ações Disponíveis */}
                {currentPlan?.slug !== 'free' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Gerenciar Assinatura</CardTitle>
                      <CardDescription>
                        Acesse o portal do Stripe para gerenciar sua assinatura
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          No portal do Stripe você pode:
                        </p>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>• Atualizar método de pagamento</li>
                          <li>• Visualizar histórico de faturas</li>
                          <li>• Baixar recibos</li>
                          <li>• Cancelar ou pausar assinatura</li>
                          <li>• Atualizar informações de cobrança</li>
                        </ul>
                        
                        <Button 
                          onClick={openCustomerPortal}
                          disabled={isOpeningPortal}
                          className="w-full"
                        >
                          {isOpeningPortal ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Abrindo portal...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Abrir Portal de Gerenciamento
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Card para Upgrade (se estiver no plano gratuito) */}
                {currentPlan?.slug === 'free' && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-blue-700">Fazer Upgrade</CardTitle>
                      <CardDescription>
                        Desbloqueie recursos premium assinando um plano pago
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-blue-600">
                          Com os planos pagos você terá acesso a:
                        </p>
                        <ul className="text-sm space-y-1 ml-4 text-blue-600">
                          <li>• Mais pacientes</li>
                          <li>• Recursos avançados</li>
                          <li>• Suporte prioritário</li>
                          <li>• Integrações premium</li>
                        </ul>
                        
                        <Button asChild className="w-full">
                          <a href="/plans">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Ver Planos Disponíveis
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Subscription;