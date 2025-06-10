
import { useState } from "react";
import { PaymentForm } from "./PaymentForm";
import { PagarmePaymentMethod } from "./PagarmePaymentMethod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePaymentData } from "@/hooks/usePaymentData";
import { useAuth } from "@/contexts/SupabaseAuthContext";

interface PaymentFormWrapperProps {
  payment?: any;
  onSave: () => void;
  onCancel?: () => void;
}

export const PaymentFormWrapper = ({ payment, onSave, onCancel }: PaymentFormWrapperProps) => {
  const { user } = useAuth();
  const { patients } = usePaymentData(user?.id || '');
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<any>(null);

  const handlePaymentCreated = (payment: any) => {
    setCreatedPayment(payment);
    setShowPaymentMethod(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentMethod(false);
    setCreatedPayment(null);
    onSave();
  };

  return (
    <>
      <PaymentForm 
        patients={patients} 
        onSave={handlePaymentCreated}
        payment={payment}
        onCancel={onCancel}
      />

      <Dialog open={showPaymentMethod} onOpenChange={setShowPaymentMethod}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Pagamento</DialogTitle>
          </DialogHeader>
          {createdPayment && (
            <PagarmePaymentMethod
              paymentId={createdPayment.id}
              amount={createdPayment.amount}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
