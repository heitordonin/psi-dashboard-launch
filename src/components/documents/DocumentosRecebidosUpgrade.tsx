import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Receipt, Calculator, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DocumentosRecebidosUpgrade = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Receipt,
      title: "Recibos no Receita Saúde",
      description: "Tenha seus recibos lançados automaticamente no sistema Receita Saúde pelo Psiclo."
    },
    {
      icon: FileText,
      title: "Despesas no Carnê Leão",
      description: "Deixe que lancemos suas despesas dentro do Carnê Leão de forma organizada."
    },
    {
      icon: Calculator,
      title: "Apuração Mensal do DARF",
      description: "Fazemos a apuração mensal do seu DARF de imposto de renda automaticamente."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Documentos Recebidos
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Funcionalidade exclusiva do Plano Psi Regular
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Tenha controle total dos seus documentos fiscais com a ajuda especializada do Psiclo
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">
                  {benefit.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Quer ter acesso a todas essas funcionalidades?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Quer ter os recibos lançados no Receita Saúde pelo Psiclo? Quer que lancemos suas despesas dentro do Carnê Leão? Quer que façamos a apuração mensal do seu DARF de imposto de renda?
          </p>
          <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text mb-8">
            Seja um(a) Psi Regular, assine agora!
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/plans')}
            >
              Upgrade para Psi Regular
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
              onClick={() => navigate('/dashboard')}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            O que está incluído no Psi Regular:
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Lançamento automático de recibos no Receita Saúde",
              "Organização de despesas no Carnê Leão",
              "Apuração mensal automática do DARF",
              "Suporte especializado em questões fiscais",
              "Relatórios detalhados de impostos",
              "Acompanhamento personalizado mensal"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};