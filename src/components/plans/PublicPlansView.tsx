import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import PublicPlanCard from "./PublicPlanCard";
import PlansBenefits from "./PlansBenefits";

const PublicPlansView = () => {
  const plans = [
    {
      name: "Grátis",
      description: "Ideal para começar",
      price: "R$ 0,00",
      period: "para sempre",
      features: [
        { text: "Até 3 pacientes" },
        { text: "Cobranças ilimitadas" },
        { text: "Dashboard básico" },
        { text: "Suporte por chamado" }
      ],
      icon: <Star className="w-8 h-8 text-gray-600" />,
      buttonText: "Começar Grátis"
    },
    {
      name: "Gestão",
      description: "Para profissionais organizados",
      price: "R$ 69,00",
      period: "por mês",
      yearlyPrice: "ou R$ 55,20 por mês (pagamento anual)",
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
    },
    {
      name: "Psi Regular",
      description: "Nunca mais se preocupe com impostos",
      price: "R$ 189,00",
      period: "por mês",
      yearlyPrice: "ou R$ 151,20 por mês (pagamento anual)",
      features: [
        { text: "Nós lançamos o seu Receita Saúde", isBold: true },
        { text: "Nós lançamos as suas despesas no Carnê Leão", isBold: true },
        { text: "Nós emitimos o seu DARF mensal", isBold: true },
        { text: "Tudo do plano Gestão +" }
      ],
      icon: <Crown className="w-8 h-8 text-psiclo-primary" />,
      isPopular: true,
      priceColor: "text-psiclo-primary"
    }
  ];

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