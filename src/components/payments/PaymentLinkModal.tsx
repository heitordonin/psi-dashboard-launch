
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl?: string | null;
  pixQrCode?: string | null;
}

export function PaymentLinkModal({
  isOpen,
  onClose,
  paymentUrl,
  pixQrCode,
}: PaymentLinkModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (paymentUrl) {
      try {
        await navigator.clipboard.writeText(paymentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Pagamento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {pixQrCode && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Pagar com PIX</h3>
              <div className="p-4 border rounded-lg bg-muted text-center">
                <div className="text-xs text-muted-foreground mb-2">
                  Código PIX QR:
                </div>
                <div className="font-mono text-xs break-all bg-background p-2 rounded border">
                  {pixQrCode}
                </div>
              </div>
            </div>
          )}

          {paymentUrl && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Pagar com Cartão de Crédito</h3>
              <div className="flex gap-2">
                <Input
                  value={paymentUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600">Link copiado!</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
