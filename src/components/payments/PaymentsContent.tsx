
import { useState } from "react";
import { usePaymentData } from "@/hooks/usePaymentData";
import { PaymentsHeader } from "./PaymentsHeader";
import { PaymentFormWrapper } from "./PaymentFormWrapper";
import { PaymentsList } from "./PaymentsList";
import { RecipientSetup } from "./RecipientSetup";

interface PaymentsContentProps {
  userId: string;
}

export const PaymentsContent = ({ userId }: PaymentsContentProps) => {
  const [showForm, setShowForm] = useState(false);
  const { payments, paymentsLoading, deletePaymentMutation } = usePaymentData(userId);

  const handleSavePayment = () => {
    setShowForm(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PaymentsHeader 
        onAddPayment={() => setShowForm(true)}
        totalPayments={payments.length}
      />

      {/* Recipient Setup - show if user doesn't have recipient configured */}
      <div className="mb-6">
        <RecipientSetup />
      </div>

      {showForm && (
        <div className="mb-6">
          <PaymentFormWrapper 
            onSave={handleSavePayment}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <PaymentsList 
        payments={payments}
        isLoading={paymentsLoading}
        onDeletePayment={deletePaymentMutation.mutate}
      />
    </div>
  );
};
