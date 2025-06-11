// src/components/payments/wizard/CreatePaymentWizard.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { WizardStepRenderer } from "./WizardStepRenderer";
import { WizardNavigation } from "./WizardNavigation";
import { X } from "lucide-react";

import type { Patient } from "@/types/patient";
import type { WizardFormData } from "./types";

interface CreatePaymentWizardProps {
  patients: Patient[];
  onClose: () => void;
  paymentToEdit?: WizardFormData | null;
}

const WIZARD_STEPS_TITLES = [
  "Tipo de Cobrança",
  "Tipo de Pagamento",
  "Detalhes do Pagamento",
  "Juros e Multa",
  "Dados do Pagador",
  "Resumo",
];

export const CreatePaymentWizard = ({ patients, onClose, paymentToEdit }: CreatePaymentWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({
    chargeType: 'link',
    paymentType: 'single',
    amount: 0,
    due_date: '',
    description: '',
    paymentMethods: ['pix', 'credit_card'],
    monthlyInterest: 0,
    lateFee: 0,
    patient_id: '',
    payer_cpf: '',
    sendEmail: true,
    isReceived: false,
    has_payment_link: true,
  });

  useEffect(() => {
    if (paymentToEdit) {
      setFormData(paymentToEdit);
    }
  }, [paymentToEdit]);

  const totalSteps = WIZARD_STEPS_TITLES.length;

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, updates }));
  };

  const handleNext = () => {
    let nextStep = currentStep + 1;
    // Pula o passo 4 (Juros e Multa) se for cobrança manual
    if (formData.chargeType === 'manual' && currentStep === 3) {
      nextStep = 5;
    }
    setCurrentStep(Math.min(nextStep, totalSteps));
  };

  const handleBack = () => {
    let prevStep = currentStep - 1;
    // Pula o passo 4 (Juros e Multa) ao voltar do passo 5
    if (formData.chargeType === 'manual' && currentStep === 5) {
      prevStep = 3;
    }
    setCurrentStep(Math.max(prevStep, 1));
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 2: // Tipo de Pagamento
        return !formData.paymentType;
      case 3: // Detalhes do Pagamento
        return !formData.amount || !formData.due_date;
      case 5: // Dados do Pagador
        return !formData.patient_id;
      default:
        return false;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">{paymentToEdit ? 'Editar Cobrança' : 'Nova Cobrança'}</DialogTitle>
          <div className="text-sm text-muted-foreground pt-2">
            <p>Passo {currentStep} de {totalSteps}: {WIZARD_STEPS_TITLES[currentStep - 1]}</p>
            <Progress value={(currentStep / totalSteps) * 100} className="mt-2" />
          </div>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>
        </DialogHeader>

        <div className="p-6">
          <WizardStepRenderer
            currentStep={currentStep}
            formData={formData}
            setFormData={setFormData}
            patients={patients}
            onNext={handleNext}
          />
        </div>

        <WizardNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={handleBack}
          onNext={handleNext}
          onClose={onClose}
          isNextDisabled={isNextDisabled()}
          isSubmitting={false} // Adicionar lógica de submitting depois
          paymentToEdit={paymentToEdit}
        />
      </DialogContent>
    </Dialog>
  );
};