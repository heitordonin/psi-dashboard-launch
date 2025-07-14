
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';

interface WizardHeaderProps {
  isEditMode: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number;
  onClose: () => void;
}

export const WizardHeader = ({ 
  isEditMode, 
  currentStep, 
  totalSteps, 
  progress, 
  onClose 
}: WizardHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 px-6 pt-6">
      <div className="flex-1">
        <CardTitle className="text-xl">
          {isEditMode ? 'Editar Paciente' : 'Novo Paciente'}
        </CardTitle>
        <div className="mt-3">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            Passo {currentStep} de {totalSteps}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClose} className="ml-4">
        <X className="h-4 w-4" />
      </Button>
    </CardHeader>
  );
};
