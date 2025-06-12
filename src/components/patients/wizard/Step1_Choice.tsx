
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus, Link2, Clock } from 'lucide-react';

interface Step1_ChoiceProps {
  onNext: () => void;
  onChoiceSelect: (type: 'manual' | 'invite') => void;
}

export const Step1_Choice = ({ onNext, onChoiceSelect }: Step1_ChoiceProps) => {
  const handleManualChoice = () => {
    onChoiceSelect('manual');
  };

  const handleInviteChoice = () => {
    onChoiceSelect('invite');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Como deseja cadastrar o paciente?</h3>
        <p className="text-gray-600">Escolha uma das opções abaixo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manual Entry Option */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
          onClick={handleManualChoice}
        >
          <CardHeader className="text-center">
            <UserPlus className="h-12 w-12 mx-auto text-blue-600 mb-2" />
            <CardTitle>Preencher dados do paciente</CardTitle>
            <CardDescription>
              Preencha você mesmo as informações do paciente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleManualChoice}>
              Continuar
            </Button>
          </CardContent>
        </Card>

        {/* Self-Registration Option (Disabled) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-not-allowed opacity-50 border-2">
                <CardHeader className="text-center">
                  <div className="relative">
                    <Link2 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <Clock className="h-6 w-6 absolute -top-1 -right-1 text-orange-500" />
                  </div>
                  <CardTitle>Enviar link de cadastro</CardTitle>
                  <CardDescription>
                    O paciente preenche seus próprios dados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled onClick={handleInviteChoice}>
                    Em breve
                  </Button>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Esta funcionalidade estará disponível em breve</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
