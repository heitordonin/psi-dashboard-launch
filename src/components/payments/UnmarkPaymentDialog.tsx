import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface UnmarkPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paidDate: string;
}

export const UnmarkPaymentDialog: React.FC<UnmarkPaymentDialogProps> = ({
  isOpen,
  onClose,
  paidDate
}) => {
  const formattedDate = new Date(paidDate).toLocaleDateString('pt-BR');

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Mês Fechado - Carnê Leão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            Você está tentando desmarcar um recebimento registrado em <strong>{formattedDate}</strong>.
            <br /><br />
            <strong>O seu mês já foi fechado</strong>, não é possível desmarcar este pagamento.
            <br /><br />
            Para alterações você deve abrir um chamado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Entendi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};