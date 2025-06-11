
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentItem } from "./PaymentItem";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentsListProps {
  payments: PaymentWithPatient[];
  isLoading: boolean;
  onDeletePayment: (paymentId: string) => void;
  onEditPayment: (payment: Payment) => void;
  hasFilters?: boolean;
}

export const PaymentsList = ({
  payments,
  isLoading,
  onDeletePayment,
  onEditPayment,
  hasFilters = false
}: PaymentsListProps) => {
  
  const onNewPayment = () => {
    // Legacy function - not implemented in this version
    console.log('New payment clicked');
  };

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando cobranças...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {hasFilters
                ? 'Nenhuma cobrança encontrada com os filtros aplicados' 
                : 'Nenhuma cobrança cadastrada'
              }
            </p>
            <Button onClick={onNewPayment} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira cobrança
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {payments.map((payment) => (
              <PaymentItem
                key={payment.id}
                payment={payment}
                onEdit={onEditPayment}
                onDelete={onDeletePayment}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
