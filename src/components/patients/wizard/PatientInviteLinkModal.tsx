
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Copy, Share } from 'lucide-react';
import { toast } from 'sonner';

interface PatientInviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink: string;
}

export const PatientInviteLinkModal = ({ isOpen, onClose, inviteLink }: PatientInviteLinkModalProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Erro ao copiar link');
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  const handleConfirm = () => {
    handleCopyLink();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-primary">
            <Share className="w-5 h-5" />
            Link de Cadastro do Paciente
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Copie este link e envie para o seu paciente. O link é válido por 2 horas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <Input
            value={inviteLink}
            readOnly
            className="text-sm"
          />
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="mt-0" onClick={handleClose}>
            Fechar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copiado!' : 'Copiar Link'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
