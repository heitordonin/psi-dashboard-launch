
import { WizardStep1PaymentType } from './WizardStep1PaymentType';
import { WizardStep2PaymentDetails } from './WizardStep2PaymentDetails';
import { WizardStep3FeesInterest } from './WizardStep3FeesInterest';
import { WizardStep4PayerDetails } from './WizardStep4PayerDetails';
import { WizardStep5Summary } from './WizardStep5Summary';
import type { WizardFormData } from './types';
import type { Patient } from '@/types/patient';

interface WizardStepRendererProps {
  currentStep: number;
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  patients: Patient[];
  onNext: () => void;
  onSuccess?: () => void;
  onClose: () => void;
}

export function WizardStepRenderer({
  currentStep,
  formData,
  updateFormData,
  patients,
  onNext,
  onSuccess,
  onClose
}: WizardStepRendererProps) {
  switch (currentStep) {
    case 1:
      return (
        <WizardStep1PaymentType
          selectedType={formData.paymentType}
          onSelect={(type) => updateFormData({ paymentType: type })}
          onNext={onNext}
        />
      );
    case 2:
      return (
        <WizardStep2PaymentDetails
          formData={formData}
          updateFormData={updateFormData}
          onNext={onNext}
        />
      );
    case 3:
      return (
        <WizardStep3FeesInterest
          monthlyInterest={formData.monthlyInterest}
          lateFee={formData.lateFee}
          updateFormData={updateFormData}
          onNext={onNext}
        />
      );
    case 4:
      return (
        <WizardStep4PayerDetails
          formData={formData}
          updateFormData={updateFormData}
          patients={patients}
          onNext={onNext}
        />
      );
    case 5:
      return (
        <WizardStep5Summary
          formData={formData}
          patients={patients}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      );
    default:
      return null;
  }
}
