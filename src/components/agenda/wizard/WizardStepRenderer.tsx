import { WizardStep1Title } from "./WizardStep1Title";
import { WizardStep2DateTime } from "./WizardStep2DateTime";
import { WizardStep3Patient } from "./WizardStep3Patient";
import { WizardStep4Reminders } from "./WizardStep4Reminders";
import { WizardStep5Summary } from "./WizardStep5Summary";
import { AppointmentWizardStepProps } from "./types";

interface WizardStepRendererProps extends AppointmentWizardStepProps {
  currentStep: number;
}

export const WizardStepRenderer = ({ currentStep, ...props }: WizardStepRendererProps) => {
  switch (currentStep) {
    case 0:
      return <WizardStep1Title {...props} />;
    case 1:
      return <WizardStep2DateTime {...props} />;
    case 2:
      return <WizardStep3Patient {...props} />;
    case 3:
      return <WizardStep4Reminders {...props} />;
    case 4:
      return <WizardStep5Summary {...props} />;
    default:
      return <WizardStep1Title {...props} />;
  }
};