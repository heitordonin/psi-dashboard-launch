import { Check } from "lucide-react";

const PlansBenefits = () => {
  const benefits = [
    {
      title: "Teste Grátis",
      description: "14 dias para testar todas as funcionalidades"
    },
    {
      title: "Sem Compromisso", 
      description: "Cancele quando quiser, sem multas"
    },
    {
      title: "Suporte Total",
      description: "Ajuda para migrar seus dados gratuitamente"
    }
  ];

  return (
    <div className="mt-16 text-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Por que escolher o Psiclo?
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-psiclo-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-psiclo-primary" />
              </div>
              <h4 className="font-semibold mb-2">{benefit.title}</h4>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlansBenefits;