
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
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Don't render navigation on the last step (summary step)
  if (isLastStep) {
    return null;
  }

  return (
    <div className="flex justify-between pt-4 border-t">
      {/* Left side: Back button or Cancel button */}
      {!isFirstStep ? (
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      ) : onClose ? (
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
      
      {/* Right side: Next button (shown on all steps except the last) */}
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
