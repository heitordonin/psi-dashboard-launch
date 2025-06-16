
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
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <div className="flex-1">
        <CardTitle className="text-xl">
          {isEditMode ? 'Editar Paciente' : 'Novo Paciente'}
        </CardTitle>
        <div className="mt-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-500 mt-1">
            Passo {currentStep} de {totalSteps}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </CardHeader>
  );
};
