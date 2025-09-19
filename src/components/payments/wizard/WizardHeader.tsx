
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  title?: string;
  onClose?: () => void;
}

export function WizardHeader({ currentStep, totalSteps, stepTitle, title = 'Nova Cobrança', onClose }: WizardHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="border-b pb-6 px-6 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
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
