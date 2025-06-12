
import { Users, CreditCard, Calculator, BarChart3, Receipt } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Users,
      title: "Gestão de Pacientes",
      description: "Cadastro simplificado com links de autofill. Seus pacientes se cadastram sozinhos.",
      benefits: ["Limite de pacientes por plano", "Links personalizados", "Dados seguros"]
    },
    {
      icon: CreditCard,
      title: "Cobranças Automáticas",
      description: "PIX, cartão e boleto com links de pagamento automáticos via WhatsApp.",
      benefits: ["Lembretes automáticos", "Multiple formas de pagamento", "Controle de status"]
    },
    {
      icon: Calculator,
      title: "Controle Fiscal",
      description: "Receita Saúde, DARF e Carnê-Leão totalmente automatizados.",
      benefits: ["Cálculo automático", "Relatórios fiscais", "Categoria DARF"]
    },
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Métricas, gráficos e relatórios que mostram a saúde do seu negócio.",
      benefits: ["KPIs em tempo real", "Gráficos interativos", "Filtros personalizados"]
    },
    {
      icon: Receipt,
      title: "Gestão de Despesas",
      description: "Categorização automática com cálculo de alíquota efetiva.",
      benefits: ["Categorias predefinidas", "Competência fiscal", "Relatórios detalhados"]
    }
  ];

  return (
    <section id="funcionalidades" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Funcionalidades que Fazem a Diferença
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tudo que você precisa para profissionalizar sua prática psicológica em uma única plataforma.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {features.map((feature, index) => (
            <div key={index} className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-psiclo-primary rounded-lg">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-psiclo-accent rounded-full mr-3"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
