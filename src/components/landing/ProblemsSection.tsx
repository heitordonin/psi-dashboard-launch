
import { AlertTriangle, Clock, FileText } from "lucide-react";

export const ProblemsSection = () => {
  const problems = [
    {
      icon: FileText,
      title: "Cansado de planilhas desorganizadas?",
      description: "Pare de perder tempo organizando dados espalhados em múltiplas planilhas"
    },
    {
      icon: Clock,
      title: "Perdendo tempo com cobranças manuais?",
      description: "Automatize todo seu processo de cobrança e receba pagamentos mais rápido"
    },
    {
      icon: AlertTriangle,
      title: "Complicações com Receita Saúde e impostos?",
      description: "Tenha controle total sobre DARF, Carnê-Leão e emissão de recibos"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Problemas que Todo Psicólogo Enfrenta
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sabemos como é difícil gerenciar uma prática profissional. 
            Por isso criamos a solução definitiva.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6 mx-auto">
                <problem.icon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                {problem.title}
              </h3>
              <p className="text-gray-600 text-center">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
