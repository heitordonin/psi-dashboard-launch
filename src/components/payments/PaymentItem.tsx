
import { Card, CardContent } from "@/components/ui/card";
import { PaymentMainInfo } from "./PaymentMainInfo";
import { PaymentActions } from "./PaymentActions";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentItemProps {
  payment: PaymentWithPatient;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
}

export function PaymentItem({ payment, onEdit, onDelete }: PaymentItemProps) {
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* Left side - Main info */}
          <PaymentMainInfo payment={payment} />

          {/* Right side - Actions */}
          <PaymentActions 
            payment={payment}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
}
