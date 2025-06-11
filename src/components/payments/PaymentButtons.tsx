
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { EmailReminderButton } from "./EmailReminderButton";
import { WhatsAppButton } from "./WhatsAppButton";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import type { PaymentWithPatient } from "@/types/payment";

interface PaymentButtonsProps {
  payment: PaymentWithPatient;
  onEdit: (payment: any) => void;
  onDelete: (paymentId: string) => void;
}

export const PaymentButtons = ({ payment, onEdit, onDelete }: PaymentButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
      <PaymentStatusBadge status={payment.status} />
      <div className="flex gap-2">
        {/* Email reminder button */}
        <EmailReminderButton payment={payment} />
        
        {/* WhatsApp reminder button */}
        <WhatsAppButton payment={payment} />
        
        {/* Action dropdown with edit and delete options */}
        <ActionDropdown
          onEdit={() => onEdit(payment)}
          onDelete={() => onDelete(payment.id)}
          deleteDisabled={payment.status === 'paid'}
          editDisabled={payment.has_payment_link === true}
        />
      </div>
    </div>
  );
};
