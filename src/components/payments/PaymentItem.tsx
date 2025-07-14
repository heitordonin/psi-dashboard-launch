
import { Card, CardContent } from "@/components/ui/card";
import { PaymentMainInfo } from "./PaymentMainInfo";
import { PaymentActions } from "./PaymentActions";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentItemProps {
  payment: PaymentWithPatient;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
}

export function PaymentItem({ payment, onEdit, onDelete }: PaymentItemProps) {
  const { elementRef, isSwiped, resetSwipe } = useSwipeGesture({
    onSwipeRight: () => {
      if (payment.status !== 'paid' && !payment.receita_saude_receipt_issued) {
        onDelete(payment.id);
        resetSwipe();
      }
    },
    threshold: 60
  });

  const canDelete = payment.status !== 'paid' && !payment.receita_saude_receipt_issued;

  return (
    <div className="relative">
      {/* Swipe action background */}
      {canDelete && (
        <div className="swipe-actions">
          <Trash2 className="w-5 h-5 text-white" />
        </div>
      )}
      
      <Card 
        ref={elementRef}
        className={cn(
          "mb-4 hover:shadow-md transition-shadow swipe-item touch-target",
          payment.receita_saude_receipt_issued && "bg-green-50 border-green-200",
          isSwiped && canDelete && "swiped-right"
        )}
      >
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
    </div>
  );
}
