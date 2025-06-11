
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  nextButtonText?: string;
  onClose?: () => void;
}

export function WizardNavigation({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext,
  isNextDisabled = false,
  isLoading = false,
  nextButtonText = "Próximo",
  onClose
}: WizardNavigationProps) {
  const showBackButton = currentStep > 0;
  const showCancelButton = currentStep === 0 && onClose;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex justify-between pt-4 border-t">
      {showBackButton ? (
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      ) : showCancelButton ? (
        <Button
          variant="outline"
          onClick={onClose}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      ) : (
        <div />
      )}
      
      {!isLastStep && (
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
