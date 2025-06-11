// src/components/payments/wizard/WizardStepRenderer.tsx

import { WizardStep0ChargeType } from './WizardStep0ChargeType';
import { WizardStep1PaymentType } from './WizardStep1PaymentType';
import { WizardStep2PaymentDetails } from './WizardStep2PaymentDetails';
import { WizardStep3FeesInterest } from './WizardStep3FeesInterest';
import { WizardStep4PayerDetails } from './WizardStep4PayerDetails';
import { WizardStep5Summary } from './WizardStep5Summary';
import type { WizardStepProps } from './types';

interface WizardStepRendererProps extends WizardStepProps {
  currentStep: number;
}

export const WizardStepRenderer = ({ currentStep, formData, setFormData, patients, onNext }: WizardStepRendererProps) => {
  const commonProps = { formData, setFormData, patients, onNext };

  switch (currentStep) {
    case 1:
      return <WizardStep0ChargeType {...commonProps} />;
    case 2:
      return <WizardStep1PaymentType {...commonProps} />;
    case 3:
      return <WizardStep2PaymentDetails {...commonProps} />;
    case 4:
      return <WizardStep3FeesInterest {...commonProps} />;
    case 5:
      return <WizardStep4PayerDetails {...commonProps} />;
    case 6:
      return <WizardStep5Summary {...commonProps} />;
    default:
      return null;
  }
};