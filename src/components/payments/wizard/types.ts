import type { Patient } from '@/types/patient';
import type { Payment } from '@/types/payment';

export interface WizardFormData {
  // Step 0: Charge type
  chargeType: 'link' | 'manual';
  
  // Step 1: Payment type
  paymentType: 'single' | 'subscription';
  
  // Step 2: Payment details
  amount: number;
  due_date: string;
  description: string;
  paymentMethods: {
    boleto: boolean;
    creditCard: boolean;
  };
  
  // Step 3: Fees (future feature)
  monthlyInterest: number;
  lateFee: number;
  
  // Step 4: Payer details
  patient_id: string;
  paymentTitular: 'patient' | 'other';
  payer_cpf: string;
  sendEmailNotification: boolean;
  email: string;
  
  // Existing logic
  isReceived: boolean;
  receivedDate: string;
  
  // Retroactive date confirmation
  retroactiveDateConfirmed: boolean;
}

export interface CreatePaymentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  patients: Patient[];
  paymentToEdit?: Payment | null;
}

// Re-export Patient type for convenience
export type { Patient };
