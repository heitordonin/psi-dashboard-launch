
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus, Link2, Clock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PatientInviteLinkModal } from './PatientInviteLinkModal';

interface Step1_ChoiceProps {
  onNext: () => void;
  onChoiceSelect: (type: 'manual' | 'invite') => void;
}

export const Step1_Choice = ({ onNext, onChoiceSelect }: Step1_ChoiceProps) => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-patient-invite');
      
      if (error) {
        console.error('Error creating patient invite:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data?.inviteUrl) {
        setGeneratedLink(data.inviteUrl);
        setIsLinkModalOpen(true);
        toast.success('Link de convite criado com sucesso!');
      } else {
        toast.error('Erro ao gerar link de convite');
      }
    },
    onError: (error: any) => {
      console.error('Error creating invite:', error);
      toast.error('Erro ao criar convite. Tente novamente.');
    }
  });

  const handleManualChoice = () => {
    onChoiceSelect('manual');
  };

  const handleInviteChoice = () => {
    createInviteMutation.mutate();
  };

  const handleCloseModal = () => {
    setIsLinkModalOpen(false);
    setGeneratedLink('');
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

        {/* Self-Registration Option */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-300"
          onClick={handleInviteChoice}
        >
          <CardHeader className="text-center">
            <Link2 className="h-12 w-12 mx-auto text-green-600 mb-2" />
            <CardTitle>Enviar link de cadastro</CardTitle>
            <CardDescription>
              O paciente preenche seus próprios dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={handleInviteChoice}
              disabled={createInviteMutation.isPending}
            >
              {createInviteMutation.isPending ? 'Gerando...' : 'Gerar Link'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <PatientInviteLinkModal
        isOpen={isLinkModalOpen}
        onClose={handleCloseModal}
        inviteLink={generatedLink}
      />
    </div>
  );
};
