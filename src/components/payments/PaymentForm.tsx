
import { PaymentFormLogic } from './PaymentFormLogic';
import type { Payment } from '@/types/payment';
import type { Patient } from '@/types/patient';

interface PaymentFormProps {
  payment?: Payment;
  patients: Patient[];
  onSave?: (payment?: any) => void;
  onCancel?: () => void;
}

export function PaymentForm({ payment, patients, onSave, onCancel }: PaymentFormProps) {
  return (
    <PaymentFormLogic
      payment={payment}
      patients={patients}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
