import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import PublicPlanCard from "./PublicPlanCard";
import PlansBenefits from "./PlansBenefits";
import { useSubscriptionPlans } from "@/hooks/useSubscription";
import PlansLoading from "./PlansLoading";

const PublicPlansView = () => {
  const { plans: dbPlans, isLoading } = useSubscriptionPlans();

  if (isLoading) {
    return <PlansLoading />;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatYearlyPrice = (yearlyPrice: number) => {
    const monthlyYearlyPrice = yearlyPrice / 12;
    return `ou ${formatPrice(monthlyYearlyPrice)} por mês (pagamento anual)`;
  };

  const getStaticPlanData = (slug: string) => {
    switch (slug) {
      case 'free':
        return {
          name: "Grátis",
          description: "Ideal para começar",
          period: "para sempre",
          features: [
            { text: "Até 3 pacientes" },
            { text: "Cobranças ilimitadas" },
            { text: "Dashboard básico" },
            { text: "Suporte por chamado" }
          ],
          icon: <Star className="w-8 h-8 text-gray-600" />,
          buttonText: "Começar Grátis"
        };
      case 'gestao':
        return {
          name: "Gestão",
          description: "Para profissionais organizados",
          period: "por mês",
          features: [
            { text: "Pacientes ilimitados" },
            { text: "Cobranças ilimitadas" },
            { text: "Dashboard básico" },
            { text: "Suporte por chamado" },
            { text: "Lembretes de cobranças por WhatsApp" }
          ],
          icon: <Zap className="w-8 h-8 text-psiclo-secondary" />,
          buttonVariant: "outline" as const,
          priceColor: "text-psiclo-secondary"
        };
      case 'psi_regular':
        return {
          name: "Psi Regular",
          description: "Nunca mais se preocupe com impostos",
          period: "por mês",
          features: [
            { text: "Nós lançamos o seu Receita Saúde", isBold: true },
            { text: "Nós lançamos as suas despesas no Carnê Leão", isBold: true },
            { text: "Nós emitimos o seu DARF mensal", isBold: true },
            { text: "Tudo do plano Gestão +" }
          ],
          icon: <Crown className="w-8 h-8 text-psiclo-primary" />,
          isPopular: true,
          priceColor: "text-psiclo-primary"
        };
      default:
        return null;
    }
  };

  const plans = dbPlans?.map(dbPlan => {
    const staticData = getStaticPlanData(dbPlan.slug);
    if (!staticData) return null;

    return {
      ...staticData,
      price: formatPrice(dbPlan.price_monthly),
      yearlyPrice: dbPlan.price_yearly > 0 ? formatYearlyPrice(dbPlan.price_yearly) : undefined
    };
  }).filter(Boolean) || [];

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
          {plans.map((plan, index) => (
            <PublicPlanCard
              key={index}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              period={plan.period}
              yearlyPrice={plan.yearlyPrice}
              features={plan.features}
              icon={plan.icon}
              isPopular={plan.isPopular}
              buttonVariant={plan.buttonVariant}
              buttonText={plan.buttonText}
              priceColor={plan.priceColor}
            />
          ))}
        </div>

        <PlansBenefits />
      </div>
    </div>
  );
};

export default PublicPlansView;