
import React from 'react';
import { Button } from '@/components/ui/button';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
  onClose: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isNextDisabled,
  onClose,
  canGoBack = true,
  canGoNext = true
}: WizardNavigationProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex justify-between border-t pt-4">
      <div className="flex gap-2">
        {canGoBack && (
          <Button
            variant="outline"
            onClick={onPrevious}
          >
            Voltar
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={onClose}
        >
          Cancelar
        </Button>
        
        {canGoNext && !isLastStep && (
          <Button
            onClick={onNext}
            disabled={isNextDisabled}
          >
            Próximo
          </Button>
        )}
      </div>
    </div>
  );
}
