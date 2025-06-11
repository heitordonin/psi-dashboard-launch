
import { WizardStep0ChargeType } from './WizardStep0ChargeType';
import { WizardStep1PaymentType } from './WizardStep1PaymentType';
import { WizardStep2PaymentDetails } from './WizardStep2PaymentDetails';
import { WizardStep3FeesInterest } from './WizardStep3FeesInterest';
import { WizardStep4PayerDetails } from './WizardStep4PayerDetails';
import { WizardStep5Summary } from './WizardStep5Summary';
import type { WizardFormData } from './types';
import type { Patient } from '@/types/patient';
import type { Payment } from '@/types/payment';

interface WizardStepRendererProps {
  currentStep: number;
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  patients: Patient[];
  onNext: () => void;
  onPrevious: () => void;
  onSuccess?: () => void;
  onClose: () => void;
  paymentToEdit?: Payment | null;
}

export function WizardStepRenderer({
  currentStep,
  formData,
  updateFormData,
  patients,
  onNext,
  onPrevious,
  onSuccess,
  onClose,
  paymentToEdit
}: WizardStepRendererProps) {
  switch (currentStep) {
    case 0:
      return (
        <WizardStep0ChargeType
          formData={formData}
          updateFormData={updateFormData}
          onNext={onNext}
        />
      );
    case 1:
      return (
        <WizardStep1PaymentType
          formData={formData}
          updateFormData={updateFormData}
          onNext={onNext}
        />
      );
    case 2:
      return (
        <WizardStep2PaymentDetails
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    case 3:
      return (
        <WizardStep3FeesInterest
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    case 4:
      return (
        <WizardStep4PayerDetails
          formData={formData}
          updateFormData={updateFormData}
          patients={patients}
        />
      );
    case 5:
      return (
        <WizardStep5Summary
          formData={formData}
          patients={patients}
          onSuccess={onSuccess}
          onClose={onClose}
          onPrevious={onPrevious}
          updateFormData={updateFormData}
          paymentToEdit={paymentToEdit}
        />
      );
    default:
      return null;
  }
}
