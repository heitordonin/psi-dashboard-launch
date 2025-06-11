
import { Card, CardContent } from "@/components/ui/card";
import { PaymentMainInfo } from "./PaymentMainInfo";
import { PaymentActions } from "./PaymentActions";
import { cn } from "@/lib/utils";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentItemProps {
  payment: PaymentWithPatient;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
}

export function PaymentItem({ payment, onEdit, onDelete }: PaymentItemProps) {
  return (
    <Card className={cn(
      "mb-4 hover:shadow-md transition-shadow",
      payment.receita_saude_receipt_issued && "bg-green-50 border-green-200"
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
          {/* Main info section */}
          <div className="flex-1 min-w-0">
            <PaymentMainInfo payment={payment} />
          </div>

          {/* Actions section */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <PaymentActions 
              payment={payment}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
