
import { useState } from "react";
import { PaymentForm } from "./PaymentForm";
import { PagarmePaymentMethod } from "./PagarmePaymentMethod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PaymentFormWrapperProps {
  userId: string;
  patients: any[];
  onSuccess: () => void;
}

export const PaymentFormWrapper = ({ patients, onSuccess }: PaymentFormWrapperProps) => {
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<any>(null);

  const handlePaymentCreated = (payment: any) => {
    setCreatedPayment(payment);
    setShowPaymentMethod(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentMethod(false);
    setCreatedPayment(null);
    onSuccess();
  };

  return (
    <>
      <PaymentForm 
        patients={patients} 
        onSuccess={handlePaymentCreated}
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
