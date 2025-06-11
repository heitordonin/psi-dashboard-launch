
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  nextButtonText?: string;
}

export function WizardNavigation({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext,
  isNextDisabled = false,
  isLoading = false,
  nextButtonText = "Próximo"
}: WizardNavigationProps) {
  return (
    <div className="flex justify-between pt-4 border-t">
      {currentStep > 1 ? (
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      ) : (
        <div />
      )}
      
      {currentStep < totalSteps && (
        <Button
          onClick={onNext}
          className="flex items-center gap-2"
          disabled={isNextDisabled || isLoading}
        >
          {isLoading ? 'Processando...' : nextButtonText}
          {!isLoading && <ChevronRight className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
