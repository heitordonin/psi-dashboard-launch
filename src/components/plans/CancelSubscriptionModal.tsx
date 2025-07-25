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
import { Button } from "@/components/ui/button";
import { SubscriptionPlan } from "@/types/subscription";
import { AlertTriangle } from "lucide-react";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (immediate: boolean) => void;
  currentPlan: SubscriptionPlan;
  isLoading: boolean;
}

const CancelSubscriptionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentPlan, 
  isLoading 
}: CancelSubscriptionModalProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <AlertDialogTitle>Cancelar Plano {currentPlan.name}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>Tem certeza que deseja cancelar seu plano atual?</p>
            
            <div className="bg-orange-50 p-3 rounded border border-orange-200">
              <p className="text-sm text-orange-800 font-medium mb-2">
                Funcionalidades que você perderá:
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                {currentPlan.slug === 'gestao' && (
                  <>
                    <li>• Lembretes por WhatsApp</li>
                    <li>• Limite de pacientes retornará para 3</li>
                  </>
                )}
                {currentPlan.slug === 'psi_regular' && (
                  <>
                    <li>• Emissão automática de DARF</li>
                    <li>• Lançamento no Receita Saúde</li>
                    <li>• Lançamento no Carnê Leão</li>
                    <li>• Lembretes por WhatsApp</li>
                    <li>• Limite de pacientes retornará para 3</li>
                  </>
                )}
              </ul>
            </div>

            <p className="text-sm text-gray-600">
              Seu plano será cancelado no final do período atual. Você continuará tendo acesso a todas as funcionalidades até o vencimento.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col space-y-3">
          <Button
            variant="destructive"
            onClick={() => onConfirm(false)}
            disabled={isLoading}
            className="w-full"
          >
            Confirmar Cancelamento
          </Button>
          <AlertDialogCancel className="w-full">Manter Plano</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelSubscriptionModal;