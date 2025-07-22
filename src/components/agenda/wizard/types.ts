export interface AppointmentWizardStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: boolean;
  isLastStep: boolean;
}

export interface PatientOption {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
}