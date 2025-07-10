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
import { Calendar } from "lucide-react";

interface RetroactiveDateConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDate: string;
}

export const RetroactiveDateConfirmationDialog: React.FC<RetroactiveDateConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDate
}) => {
  const formattedDate = new Date(selectedDate).toLocaleDateString('pt-BR');

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
            <Calendar className="w-5 h-5" />
            Data Retroativa Detectada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            Você selecionou a data <strong>{formattedDate}</strong> que é anterior ao mês atual.
            <br /><br />
            Por impeditivo legal da legislação da Receita Saúde, cobranças/pagamentos retroativos 
            devem ser registrados até o dia 10 do mês seguinte ao vencimento.
            <br /><br />
            Deseja prosseguir com esta data mesmo assim?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="mt-0" onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Confirmar Operação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};