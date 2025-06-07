
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscription, useSubscriptionPlans } from "@/hooks/useSubscription";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { useEffect } from "react";

const Plans = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { currentPlan } = useSubscription();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'freemium':
        return <Star className="w-6 h-6" />;
      case 'basic':
        return <Zap className="w-6 h-6" />;
      case 'psi_regular':
        return <Crown className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const getFeatureLabels = (features: string[]) => {
    const featureMap: Record<string, string> = {
      unlimited_invoices: 'Cobranças ilimitadas',
      basic_dashboard: 'Dashboard básico',
      email_support: 'Suporte por email',
      email_notifications: 'Notificações por email',
      whatsapp_support: 'Suporte via WhatsApp',
      whatsapp_reminders: 'Lembretes via WhatsApp',
      receita_saude_receipts: 'Recibos Receita Saúde',
      carne_leao_tracking: 'Controle Carnê-Leão',
      monthly_darf: 'DARF mensal automática',
      radar_pj: 'Radar PJ - Simulação PJ'
    };

    return features.map(feature => featureMap[feature] || feature);
  };

  if (isLoading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Carregando planos...</p>
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
            <div className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold text-gray-900">Planos de Assinatura</h1>
                <p className="text-gray-600 mt-2">Escolha o plano ideal para sua prática</p>
              </div>
            </div>

            <div className="container mx-auto px-4 py-8">
              <div className="grid md:grid-cols-3 gap-6">
                {plans?.map((plan) => (
                  <Card key={plan.id} className={`relative ${currentPlan?.id === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
                    {currentPlan?.id === plan.id && (
                      <Badge className="absolute -top-2 left-4 bg-blue-500">
                        Plano Atual
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        {getPlanIcon(plan.slug)}
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      
                      <div className="mt-4">
                        <div className="text-3xl font-bold">
                          R$ {plan.price_monthly.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">por mês</div>
                        {plan.price_yearly > 0 && (
                          <div className="text-sm text-green-600 mt-1">
                            ou R$ {plan.price_yearly.toFixed(2)}/ano
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">
                            {plan.max_patients ? `Até ${plan.max_patients} pacientes` : 'Pacientes ilimitados'}
                          </span>
                        </div>
                        
                        {getFeatureLabels(plan.features).map((feature, index) => (
                          <div key={index} className="flex items-center">
                            <Check className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button 
                        className="w-full" 
                        variant={currentPlan?.id === plan.id ? "secondary" : "default"}
                        disabled={currentPlan?.id === plan.id}
                      >
                        {currentPlan?.id === plan.id ? 'Plano Ativo' : 'Escolher Plano'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-8 text-center text-sm text-gray-500">
                <p>* Serviços marcados com asterisco são realizados externamente pela nossa equipe</p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Plans;
