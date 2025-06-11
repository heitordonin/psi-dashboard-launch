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
  isEditMode?: boolean;
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
  isEditMode = false,
  paymentToEdit = null
}: WizardStepRendererProps) {
  // Don't render step 3 for manual charges, but keep the step number consistent
  if (currentStep === 3 && formData.chargeType === 'manual') {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Juros e multa não se aplicam a cobranças manuais.
          </p>
        </div>
      </div>
    );
  }

  switch (currentStep) {
    case 0:
      return (
        <WizardStep0ChargeType
          selectedType={formData.chargeType}
          onSelect={(type) => updateFormData({ chargeType: type })}
        />
      );
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
          isEditMode={isEditMode}
          paymentToEdit={paymentToEdit}
        />
      );
    default:
      return null;
  }
}
