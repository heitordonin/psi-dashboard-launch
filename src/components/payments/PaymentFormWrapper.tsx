
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
    // TEMPORARIAMENTE DESABILITADO - Integração Pagar.me
    // Para reativar no futuro, descomente as linhas abaixo e comente a linha onSave()
    
    // setCreatedPayment(payment);
    // setShowPaymentMethod(true);
    
    // Por enquanto, apenas fecha o modal após criar a cobrança
    onSave();
  };

  const handlePaymentSuccess = () => {
    setShowPaymentMethod(false);
    setCreatedPayment(null);
    onSave();
  };

  return (
    <>
      <div className="p-1">
        <PaymentForm 
          patients={patients} 
          onSave={handlePaymentCreated}
          payment={payment}
          onCancel={onCancel}
        />
      </div>

      {/* 
        TEMPORARIAMENTE DESABILITADO - Modal de Pagamento Pagar.me
        
        Este modal permite ao usuário finalizar o pagamento via Pagar.me após criar a cobrança.
        Para reativar esta funcionalidade no futuro:
        1. Descomente o código abaixo
        2. No handlePaymentCreated, descomente as linhas que setam o createdPayment e showPaymentMethod
        3. Comente a linha onSave() direta no handlePaymentCreated
        
        Mantido aqui para facilitar a reativação futura.
      */}
      {false && (
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
      )}
    </>
  );
};
