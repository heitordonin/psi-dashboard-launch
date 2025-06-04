
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Referral = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Programa de Indicação</h1>
          </div>

          {/* Main Card */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-indigo-600" />
              </div>
              <CardTitle className="text-xl text-indigo-900">
                Indique o Declara Psi e ganhe 3 meses grátis!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Ajude outras colegas psicólogas a organizarem melhor suas finanças 
                  e ganhe benefícios exclusivos por cada indicação bem-sucedida.
                </p>
              </div>

              {/* How it works */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-indigo-600" />
                  Como funciona:
                </h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li>1. Compartilhe o Declara Psi com suas colegas</li>
                  <li>2. Sua colega se cadastra usando seu link de indicação</li>
                  <li>3. Após o primeiro mês ativo dela, você ganha 3 meses grátis</li>
                  <li>4. Sua colega também ganha desconto especial no primeiro mês</li>
                </ol>
              </div>

              {/* CTA */}
              <div className="text-center pt-4">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" disabled>
                  Funcionalidade em desenvolvimento
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Em breve você poderá gerar seu link personalizado de indicação
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Referral;
