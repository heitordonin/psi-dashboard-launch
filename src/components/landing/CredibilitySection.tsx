
import { Shield, Users, TrendingUp, Award } from "lucide-react";

export const CredibilitySection = () => {
  const stats = [
    {
      icon: Users,
      number: "2.500+",
      label: "Psicólogos Ativos"
    },
    {
      icon: TrendingUp,
      number: "R$ 15M+",
      label: "Em Cobranças Processadas"
    },
    {
      icon: Shield,
      number: "99.9%",
      label: "Uptime Garantido"
    },
    {
      icon: Award,
      number: "4.9/5",
      label: "Avaliação dos Usuários"
    }
  ];

  return (
    <section className="py-20 bg-psiclo-primary text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Confiado por Milhares de Profissionais
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Números que comprovam nossa excelência e o sucesso dos nossos usuários.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4 mx-auto">
                <stat.icon className="w-8 h-8 text-psiclo-accent" />
              </div>
              <div className="text-3xl font-bold text-psiclo-accent mb-2">
                {stat.number}
              </div>
              <div className="text-white/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold mb-4">O que nossos usuários dizem</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-xl p-6">
              <p className="text-white/90 mb-4 italic">
                "O Psiclo revolucionou minha prática. Antes gastava horas com planilhas, 
                agora tenho tudo automatizado e posso focar nos meus pacientes."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-psiclo-accent rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold">Dra. Maria Santos</div>
                  <div className="text-sm text-white/70">Psicóloga Clínica - SP</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6">
              <p className="text-white/90 mb-4 italic">
                "A funcionalidade de Receita Saúde me economiza muito tempo. 
                O sistema calcula tudo automaticamente e gera os recibos."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-psiclo-accent rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold">Dr. João Silva</div>
                  <div className="text-sm text-white/70">Psicólogo - RJ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
