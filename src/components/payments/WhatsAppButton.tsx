
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import type { PaymentWithPatient } from "@/types/payment";
import { format } from "date-fns";

interface WhatsAppButtonProps {
  payment: PaymentWithPatient;
}

export function WhatsAppButton({ payment }: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
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

  // Template da mensagem conforme especificado
  const defaultMessage = `Olá, ${patientName}.

Este é um lembrete sobre sua cobrança referente aos seus atendimentos - seu psicólogo(a).

Valor: ${formatCurrency(Number(payment.amount))}
Vencimento: ${formatDate(payment.due_date)}

Se já realizou o pagamento, por favor, desconsidere esta mensagem.
Qualquer dúvida, estou à disposição!

Atenciosamente,
Equipe Psiclo - App de cobrança para Psis Regulares`;

  const handleOpen = () => {
    setMessage(defaultMessage);
    setIsOpen(true);
  };

  const handleSend = () => {
    if (!patientPhone) {
      return;
    }

    if (!message.trim()) {
      return;
    }

    sendWhatsApp({
      to: patientPhone,
      message: message.trim(),
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
        <Button variant="outline" size="sm" onClick={handleOpen}>
          <MessageCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Lembrete via WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Para: {patientName}</Label>
            <p className="text-sm text-muted-foreground">{patientPhone}</p>
          </div>
          
          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={isLoading} className="flex-1">
              {isLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
