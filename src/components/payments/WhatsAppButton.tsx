
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

    // Use template variables for the payment reminder
    const templateVariables = [
      patientName,
      'seu psicólogo(a)',
      formatCurrency(Number(payment.amount)),
      formatDate(payment.due_date)
    ];

    sendWhatsApp({
      to: patientPhone,
      templateSid: 'TWILIO_TEMPLATE_SID_LEMBRETE', // This will be replaced with actual SID in edge function
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
          <MessageCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Lembrete via WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              <strong>Para:</strong> {patientName} ({patientPhone})
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Valor:</strong> {formatCurrency(Number(payment.amount))}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Vencimento:</strong> {formatDate(payment.due_date)}
            </p>
          </div>
          
          <p className="text-sm text-gray-600">
            Será enviado um lembrete padronizado sobre esta cobrança.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={isLoading} className="flex-1">
              {isLoading ? 'Enviando...' : 'Enviar Lembrete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
