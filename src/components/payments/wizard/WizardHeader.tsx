
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onClose: () => void;
}

export function WizardHeader({ 
  currentStep, 
  totalSteps, 
  stepTitles, 
  onClose 
}: WizardHeaderProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <DialogHeader className="space-y-4">
      <div className="flex items-center justify-between">
        <DialogTitle className="text-xl font-semibold">
          Nova Cobrança
        </DialogTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Etapa {currentStep} de {totalSteps}</span>
          <span>{stepTitles[currentStep - 1]}</span>
        </div>
        <Progress value={progressPercentage} className="w-full" />
      </div>
    </DialogHeader>
  );
}
