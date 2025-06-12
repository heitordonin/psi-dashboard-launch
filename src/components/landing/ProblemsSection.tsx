
import { CreditCard, BarChart3, FileText, Receipt } from "lucide-react";

export const ProblemsSection = () => {
  const problems = [
    {
      icon: CreditCard,
      title: "Dificuldade em cobrar seus pacientes?",
      description: "Sabemos como é \"chato\" enviar cobranças. Deixe que fazemos isso em nosso nome por você."
    },
    {
      icon: BarChart3,
      title: "Não sabe o quanto você ganha e gasta?",
      description: "Gráficos limpos e intuitivos para mostrar sua saúde financeira."
    },
    {
      icon: FileText,
      title: "Cansado de planilhas desorganizadas?",
      description: "Pare de perder tempo organizando dados espalhados e sem visualização nenhuma."
    },
    {
      icon: Receipt,
      title: "Complicações com o Receita Saúde?",
      description: "Escolha planos que vão desde módulo para copiar as informações com facilidade até deixar a emissão com a gente."
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
