import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { WizardStepRenderer } from "./wizard/WizardStepRenderer";
import { useAppointmentWizard } from "./wizard/useAppointmentWizard";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomSheet } from "@/components/ui/bottom-sheet";

interface CreateAppointmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Novo Agendamento</h2>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} de {totalSteps}
          </span>
        </div>
        
        <Progress value={progressValue} className="h-2" />
      </div>

      <div className="py-6">
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

      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 0 ? handleClose : prevStep}
          disabled={isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentStep === 0 ? "Cancelar" : "Voltar"}
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceedToNextStep() || isSubmitting}
        >
          {isLastStep ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              {isSubmitting ? "Criando..." : "Confirmar"}
            </>
          ) : (
            <>
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={handleClose}>
        <div className="p-4">{content}</div>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};