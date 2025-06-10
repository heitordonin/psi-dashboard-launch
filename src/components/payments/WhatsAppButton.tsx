
import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import type { PaymentWithPatient } from "@/types/payment";
import { format } from "date-fns";

interface WhatsAppButtonProps {
  payment: PaymentWithPatient;
}

export function WhatsAppButton({ payment }: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { sendWhatsApp, isLoading } = useWhatsApp();
  const { user } = useAuth();

  const patientName = payment.patients?.full_name || 'Paciente';
  const patientPhone = payment.patients?.phone;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const handleSend = () => {
    if (!patientPhone) {
      return;
    }

    // Garante que temos um nome de psicólogo para a mensagem
    const psychologistName = user?.user_metadata?.full_name || "seu psicólogo(a)";

    // CORREÇÃO: Usar objeto com chaves numeradas em vez de array
    const templateVariables = {
      "1": patientName,
      "2": psychologistName,
      "3": formatCurrency(Number(payment.amount)),
      "4": formatDate(payment.due_date)
    };

    sendWhatsApp({
      to: patientPhone,
      templateSid: 'TWILIO_TEMPLATE_SID_LEMBRETE',
      templateVariables,
      paymentId: payment.id,
      messageType: 'payment_reminder'
    });

    setIsOpen(false);
  };

  // Não mostrar o botão se não há telefone ou se não é pagamento pendente
  if (!patientPhone || payment.status !== 'pending') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle className="w-4 h-4 mr-2" />
          Lembrete WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Envio</DialogTitle>
          <DialogDescription>
            Um lembrete de cobrança será enviado para o WhatsApp de <strong>{patientName}</strong> ({patientPhone}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Valor:</strong> {formatCurrency(Number(payment.amount))}</p>
            <p><strong>Vencimento:</strong> {formatDate(payment.due_date)}</p>
          </div>
          
          <p className="text-sm text-gray-600">
            Será enviado um lembrete padronizado sobre esta cobrança.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Lembrete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
