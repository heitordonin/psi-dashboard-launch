
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function WizardNavigation({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext 
}: WizardNavigationProps) {
  if (currentStep === 1 || currentStep === totalSteps) {
    return null;
  }

  return (
    <div className="flex justify-between pt-4 border-t">
      <Button
        variant="outline"
        onClick={onPrevious}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Button>
      
      <Button
        onClick={onNext}
        className="flex items-center gap-2"
      >
        Próximo
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
