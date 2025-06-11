
import { useState } from "react";
import { Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PaymentLinkModal } from "./PaymentLinkModal";
import type { PaymentWithPatient } from "@/types/payment";

interface PaymentLinkButtonProps {
  payment: PaymentWithPatient;
}

export function PaymentLinkButton({ payment }: PaymentLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link className="h-4 w-4 mr-2" />
          Ver Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <PaymentLinkModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          paymentUrl={payment.payment_url}
          pixQrCode={payment.pix_qr_code}
        />
      </DialogContent>
    </Dialog>
  );
}
