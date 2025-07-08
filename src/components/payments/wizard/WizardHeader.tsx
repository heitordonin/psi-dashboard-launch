
import { Progress } from '@/components/ui/progress';

interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  title?: string;
}

export function WizardHeader({ currentStep, totalSteps, stepTitle, title = 'Nova Cobrança' }: WizardHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="border-b pb-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
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
