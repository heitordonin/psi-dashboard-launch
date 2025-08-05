import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Users, Clock, CreditCard } from "lucide-react";
import DirectCheckoutButton from "@/components/checkout/DirectCheckoutButton";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const features = [
    "Gestão completa de pacientes",
    "Controle financeiro integrado", 
    "Agenda inteligente",
    "Relatórios profissionais",
    "Lembretes automáticos",
    "Suporte especializado"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">Psiclo</div>
          <div className="space-x-4">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            O Sistema de Gestão Completo para <span className="text-primary">Psicólogos</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Organize sua prática, gerencie pacientes e controle suas finanças em uma única plataforma intuitiva e profissional.
          </p>
          
          <div className="flex justify-center space-x-4 mb-12">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="text-sm text-gray-600">4.9/5 avaliação</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">+1.000 psicólogos</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">Economize 5h/semana</span>
            </div>
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Escolha o Plano Ideal para Você
          </h2>
          <p className="text-lg text-gray-600">
            Comece hoje mesmo e transforme sua prática clínica
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plano Gestão */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Plano Gestão</CardTitle>
              <div className="text-3xl font-bold text-primary">R$ 49<span className="text-lg">/mês</span></div>
              <p className="text-gray-600">Ideal para psicólogos que querem organizar sua prática</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-2 pt-4">
                <DirectCheckoutButton 
                  planSlug="gestao"
                  className="w-full"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Assinar Agora - R$ 49/mês
                </DirectCheckoutButton>
                
                <Link to="/signup?plan=gestao" className="block">
                  <Button variant="outline" className="w-full">
                    Criar conta primeiro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Plano Psi Regular */}
          <Card className="relative border-2 border-primary">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                Mais Popular
              </span>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Plano Psi Regular</CardTitle>
              <div className="text-3xl font-bold text-primary">R$ 189<span className="text-lg">/mês</span></div>
              <p className="text-gray-600">Para psicólogos que precisam de recursos avançados</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-2 pt-4">
                <DirectCheckoutButton 
                  planSlug="psi_regular"
                  className="w-full"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Assinar Agora - R$ 189/mês
                </DirectCheckoutButton>
                
                <Link to="/signup?plan=psi_regular" className="block">
                  <Button variant="outline" className="w-full">
                    Criar conta primeiro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            ✓ 7 dias grátis • ✓ Cancele quando quiser • ✓ Suporte especializado
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para Transformar sua Prática?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a centenas de psicólogos que já otimizaram sua rotina com o Psiclo
          </p>
          
          <div className="flex justify-center space-x-4">
            <DirectCheckoutButton 
              planSlug="psi_regular"
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
            >
              Começar Agora - R$ 189/mês
            </DirectCheckoutButton>
            
            <Link to="/signup">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                Experimentar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;