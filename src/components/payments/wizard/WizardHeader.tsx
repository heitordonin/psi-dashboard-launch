
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  onClose: () => void;
  wizardTitle?: string;
}

export function WizardHeader({ 
  currentStep, 
  totalSteps, 
  stepTitle, 
  onClose, 
  wizardTitle = 'Nova Cobrança' 
}: WizardHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="border-b pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{wizardTitle}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{stepTitle}</span>
          <span className="text-muted-foreground">
            Etapa {currentStep} de {totalSteps}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}
