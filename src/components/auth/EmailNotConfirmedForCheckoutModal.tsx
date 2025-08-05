import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle } from 'lucide-react';

interface EmailNotConfirmedForCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryCheckout: () => void;
}

export const EmailNotConfirmedForCheckoutModal = ({
  isOpen,
  onClose,
  onTryCheckout
}: EmailNotConfirmedForCheckoutModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email não confirmado
          </DialogTitle>
          <DialogDescription>
            Para processar seu checkout, precisamos que você confirme seu email primeiro.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Verifique sua caixa de entrada e clique no link de confirmação que enviamos.
            Após confirmar, você pode tentar o checkout novamente.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={onTryCheckout} variant="default">
            Tentar checkout novamente
          </Button>
          <Button onClick={onClose} variant="outline">
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};