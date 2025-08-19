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
import { MessageCircle } from "lucide-react";
import type { PaymentWithPatient } from '@/types/payment';

interface WhatsAppConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payment: PaymentWithPatient;
  isLoading?: boolean;
  planSlug?: string;
  messagesRemaining?: number;
  isUnlimited?: boolean;
}

export const WhatsAppConfirmationDialog: React.FC<WhatsAppConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  payment,
  isLoading = false,
  planSlug,
  messagesRemaining,
  isUnlimited = false
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDescription = () => {
    const baseInfo = (
      <>
        Será enviado um lembrete para <strong>{payment.patients?.full_name}</strong> sobre o pagamento:
        <br /><br />
        <strong>Valor:</strong> {formatCurrency(payment.amount)}
        <br />
        <strong>Vencimento:</strong> {formatDate(payment.due_date)}
      </>
    );

    if (planSlug === 'gestao' && !isUnlimited) {
      return (
        <>
          {baseInfo}
          <br /><br />
          <strong>Mensagens restantes:</strong> {messagesRemaining} de 40 mensais
        </>
      );
    }

    return (
      <>
        {baseInfo}
        <br /><br />
        <em>Plano Psi Regular - Mensagens ilimitadas</em>
      </>
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-green-600">
            <MessageCircle className="w-5 h-5" />
            Confirmar envio por WhatsApp
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="mt-0" onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar WhatsApp'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};