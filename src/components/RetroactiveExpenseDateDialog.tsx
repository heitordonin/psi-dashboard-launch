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
import { AlertTriangle } from "lucide-react";

interface RetroactiveExpenseDateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDate: string;
}

export const RetroactiveExpenseDateDialog: React.FC<RetroactiveExpenseDateDialogProps> = ({
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
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Mês Fechado - Carnê Leão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            Você está registrando uma despesa com data <strong>{formattedDate}</strong>.
            <br /><br />
            <strong>O seu mês já foi fechado</strong>, tem certeza que deseja realizar esse lançamento retroativo?
            <br /><br />
            Para atualizar no seu Carnê Leão você deve abrir um chamado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="mt-0" onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Ciente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};