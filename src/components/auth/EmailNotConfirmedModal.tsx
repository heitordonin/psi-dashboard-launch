import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailNotConfirmedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export const EmailNotConfirmedModal = ({ open, onOpenChange, email }: EmailNotConfirmedModalProps) => {
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast.error('Erro ao reenviar email: ' + error.message);
      } else {
        toast.success('Email de confirmação reenviado com sucesso!');
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Erro inesperado ao reenviar email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Email ainda não confirmado
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>
              Enviamos um email de confirmação para <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Verifique sua caixa de entrada e clique no link para ativar sua conta. 
              Não se esqueça de verificar a pasta de spam!
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Reenviar Email de Confirmação
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Voltar ao Login
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            💡 Dica: Após confirmar o email, você precisará verificar seu WhatsApp também
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};