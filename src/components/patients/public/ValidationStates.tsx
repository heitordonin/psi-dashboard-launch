import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ValidationStatesProps {
  state: 'loading' | 'invalid' | 'success';
}

export const ValidationStates = ({ state }: ValidationStatesProps) => {
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Convite Inválido</h2>
            <p className="text-gray-600 mb-4">
              Link de convite inválido ou expirado. Por favor, solicite um novo link ao seu psicólogo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cadastro Realizado!</h2>
            <p className="text-gray-600 mb-4">
              Seu cadastro foi realizado com sucesso. Em breve você receberá mais informações do seu psicólogo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};