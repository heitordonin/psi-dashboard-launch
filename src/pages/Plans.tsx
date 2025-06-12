import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscription, useSubscriptionPlans } from "@/hooks/useSubscription";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

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
      case 'gratis':
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

  // Se não há usuário logado, mostrar página pública de planos
  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-4">
          <div className="container mx-auto flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Planos Psiclo</h1>
              <p className="text-sm text-gray-600">Escolha o plano ideal para sua prática</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planos que Crescem com Você
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comece grátis e evolua conforme sua prática cresce. Todos os planos incluem suporte e atualizações.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plano Grátis */}
            <Card className="relative">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Star className="w-8 h-8 text-gray-600" />
                </div>
                <CardTitle className="text-2xl">Grátis</CardTitle>
                <CardDescription>Ideal para começar</CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-gray-900">Grátis</div>
                  <div className="text-sm text-gray-500">para sempre</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Até 3 pacientes</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Cobranças básicas</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Dashboard simples</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Suporte por email</span>
                  </div>
                </div>
                <Link to="/signup">
                  <Button className="w-full">Começar Grátis</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plano Psi Regular */}
            <Card className="relative ring-2 ring-psiclo-accent scale-105">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-psiclo-accent text-psiclo-primary">
                Mais Popular
              </Badge>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Crown className="w-8 h-8 text-psiclo-primary" />
                </div>
                <CardTitle className="text-2xl">Psi Regular</CardTitle>
                <CardDescription>Para profissionais sérios</CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-psiclo-primary">R$ 49,90</div>
                  <div className="text-sm text-gray-500">por mês</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Pacientes ilimitados</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">WhatsApp automático</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Receita Saúde completa</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Controle Carnê-Leão</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">DARF automática</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Suporte prioritário</span>
                  </div>
                </div>
                <Link to="/signup">
                  <Button className="w-full bg-psiclo-accent hover:bg-psiclo-accent/90 text-psiclo-primary">
                    Escolher Plano
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plano Psi Pro */}
            <Card className="relative">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Zap className="w-8 h-8 text-psiclo-secondary" />
                </div>
                <CardTitle className="text-2xl">Psi Pro</CardTitle>
                <CardDescription>Máximo desempenho</CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-psiclo-secondary">R$ 89,90</div>
                  <div className="text-sm text-gray-500">por mês</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Tudo do Regular</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Radar PJ - Simulação</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Relatórios avançados</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">API personalizada</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Suporte dedicado</span>
                  </div>
                </div>
                <Link to="/signup">
                  <Button className="w-full" variant="outline">Escolher Plano</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Por que escolher o Psiclo?
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-psiclo-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-psiclo-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Teste Grátis</h4>
                  <p className="text-sm text-gray-600">14 dias para testar todas as funcionalidades</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-psiclo-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-psiclo-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Sem Compromisso</h4>
                  <p className="text-sm text-gray-600">Cancele quando quiser, sem multas</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-psiclo-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-psiclo-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Suporte Total</h4>
                  <p className="text-sm text-gray-600">Ajuda para migrar seus dados gratuitamente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  // Usuário logado - interface administrativa
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
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Planos de Assinatura</h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>Escolha o plano ideal para sua prática</p>
                </div>
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
