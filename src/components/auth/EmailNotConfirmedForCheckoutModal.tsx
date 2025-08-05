import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // Re-verificar status do email em tempo real
  useEffect(() => {
    if (isOpen && user) {
      const checkEmailStatus = () => {
        const confirmed = user.email_confirmed_at !== null;
        setEmailConfirmed(confirmed);
        
        if (confirmed) {
          toast.success('Email confirmado! Você pode prosseguir com o checkout.');
        }
      };

      // Verificar imediatamente
      checkEmailStatus();

      // Verificar a cada 3 segundos enquanto modal estiver aberto
      const interval = setInterval(checkEmailStatus, 3000);

      return () => clearInterval(interval);
    }
  }, [isOpen, user]);

  const handleRefreshCheck = async () => {
    setIsCheckingEmail(true);
    
    // Aguardar um momento para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (user?.email_confirmed_at) {
      setEmailConfirmed(true);
      toast.success('Email confirmado!');
    } else {
      toast.info('Email ainda não confirmado. Verifique sua caixa de entrada.');
    }
    
    setIsCheckingEmail(false);
  };

  const handleTryCheckout = () => {
    // Verificar estado novamente antes de executar
    if (!user?.email_confirmed_at) {
      toast.error('Email ainda não confirmado. Confirme seu email primeiro.');
      return;
    }
    
    onTryCheckout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {emailConfirmed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Mail className="w-5 h-5 text-primary" />
            )}
            {emailConfirmed ? 'Email confirmado!' : 'Email não confirmado'}
          </DialogTitle>
          <DialogDescription>
            {emailConfirmed 
              ? 'Seu email foi confirmado. Você pode prosseguir com o checkout.'
              : 'Para processar seu checkout, precisamos que você confirme seu email primeiro.'
            }
          </DialogDescription>
        </DialogHeader>

        <Alert className={emailConfirmed ? 'border-green-200 bg-green-50' : ''}>
          {emailConfirmed ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {emailConfirmed ? (
              'Email confirmado com sucesso! Agora você pode continuar com o checkout.'
            ) : (
              'Verifique sua caixa de entrada e clique no link de confirmação que enviamos. Após confirmar, você pode tentar o checkout novamente.'
            )}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2 mt-4">
          {!emailConfirmed && (
            <Button 
              onClick={handleRefreshCheck} 
              variant="outline"
              disabled={isCheckingEmail}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isCheckingEmail ? 'animate-spin' : ''}`} />
              {isCheckingEmail ? 'Verificando...' : 'Verificar novamente'}
            </Button>
          )}
          
          <Button 
            onClick={handleTryCheckout} 
            variant="default"
            disabled={!emailConfirmed}
          >
            {emailConfirmed ? 'Continuar para checkout' : 'Tentar checkout novamente'}
          </Button>
          
          <Button onClick={onClose} variant="outline">
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};