import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InvalidPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvalidPlanModal = ({ isOpen, onClose }: InvalidPlanModalProps) => {
  const navigate = useNavigate();

  const handleGoToPlans = () => {
    onClose();
    navigate('/plans');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Plano não encontrado
          </DialogTitle>
          <DialogDescription>
            O plano selecionado não existe ou não está mais disponível.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Por favor, escolha um dos nossos planos disponíveis para continuar.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleGoToPlans} variant="default">
            Ver planos disponíveis
          </Button>
          <Button onClick={onClose} variant="outline">
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};