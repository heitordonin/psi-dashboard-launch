
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export const PlansPreviewSection = () => {
  const plans = [
    {
      name: "Grátis",
      price: "R$ 0,00",
      period: "para sempre",
      features: [
        "Até 3 pacientes",
        "Cobranças ilimitadas",
        "Dashboard básico",
        "Suporte por chamado"
      ],
      popular: false
    },
    {
      name: "Gestão",
      price: "R$ 69,00",
      period: "/mês",
      features: [
        "Pacientes ilimitados",
        "Cobranças ilimitadas",
        "Dashboard básico",
        "Suporte por chamado",
        "Lembretes de cobranças por WhatsApp"
      ],
      popular: false
    },
    {
      name: "Psi Regular",
      price: "R$ 269,00",
      period: "/mês",
      features: [
        "Nós lançamos o seu Receita Saúde",
        "Nós lançamos as suas despesas no Carnê Leão",
        "Nós emitimos o seu DARF mensal",
        "Tudo do plano Gestão +"
      ],
      popular: true
    }
  ];

  return (
    <section id="planos" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o Plano Ideal para Você
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comece grátis e evolua conforme sua prática cresce.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-2xl p-8 relative ${
                plan.popular ? 'ring-2 ring-psiclo-accent shadow-2xl scale-105' : 'shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-psiclo-accent text-psiclo-primary px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-psiclo-primary mb-1">
                  {plan.price}
                </div>
                <div className="text-gray-500">{plan.period}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-psiclo-accent hover:bg-psiclo-accent/90 text-psiclo-primary' 
                    : 'bg-psiclo-primary hover:bg-psiclo-primary/90'
                }`}
                size="lg"
              >
                {plan.price === "R$ 0,00" ? "Começar Grátis" : "Escolher Plano"}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/plans">
            <Button variant="outline" size="lg" className="px-8">
              Ver Comparação Completa dos Planos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
