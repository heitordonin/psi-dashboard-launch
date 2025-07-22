import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { WizardStepRenderer } from "./wizard/WizardStepRenderer";
import { useAppointmentWizard } from "./wizard/useAppointmentWizard";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CreateAppointmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_TITLES = [
  "Título",
  "Data e Hora", 
  "Paciente",
  "Lembretes",
  "Confirmação"
];

export const CreateAppointmentWizard = ({ isOpen, onClose }: CreateAppointmentWizardProps) => {
  const isMobile = useIsMobile();
  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    resetWizard,
    submitAppointment,
    canProceedToNextStep,
    isLastStep,
    totalSteps,
    isSubmitting,
  } = useAppointmentWizard();

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleNext = () => {
    if (isLastStep) {
      submitAppointment();
      handleClose();
    } else {
      nextStep();
    }
  };

  const progressValue = ((currentStep + 1) / totalSteps) * 100;

  const content = (
    <div className="relative">
      {/* Header aprimorado */}
      <div className="relative pb-6 mb-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Novo Agendamento</h2>
              <p className="text-sm text-muted-foreground">
                {STEP_TITLES[currentStep]}
              </p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navegação por steps visual */}
        <div className="flex items-center justify-between mb-4">
          {STEP_TITLES.map((title, index) => (
            <div key={title} className="flex items-center">
              <div className="text-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200",
                  index <= currentStep 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p className={cn(
                  "text-xs mt-1 transition-colors duration-200 hidden sm:block",
                  index <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {title}
                </p>
              </div>
              {index < STEP_TITLES.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 transition-colors duration-300",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Progress bar mais sutil */}
        <Progress 
          value={progressValue} 
          className="h-1 bg-muted" 
        />
      </div>

      {/* Conteúdo do step com animação */}
      <div className="min-h-[300px] mb-6">
        <div className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
          <WizardStepRenderer
            currentStep={currentStep}
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            canProceed={canProceedToNextStep()}
            isLastStep={isLastStep}
          />
        </div>
      </div>

      {/* Footer aprimorado */}
      <div className="flex items-center justify-between pt-6 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Passo {currentStep + 1} de {totalSteps}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}

          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceedToNextStep() || isSubmitting}
            className={cn(
              "min-w-[120px] transition-all duration-200",
              isLastStep && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Criando...
              </div>
            ) : isLastStep ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={handleClose}>
        <div className="p-6">{content}</div>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">{content}</div>
      </DialogContent>
    </Dialog>
  );
};