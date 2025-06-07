
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import type { Payment } from "@/types/payment";

interface WhatsAppButtonProps {
  payment: Payment;
  patientName: string;
  patientPhone?: string;
}

export function WhatsAppButton({ payment, patientName, patientPhone }: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { sendWhatsApp, isLoading } = useWhatsApp();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const defaultMessage = `Olá ${patientName}! 

Lembrando sobre o pagamento em aberto:
💰 Valor: ${formatCurrency(Number(payment.amount))}
📅 Vencimento: ${formatDate(payment.due_date)}
${payment.description ? `📝 Descrição: ${payment.description}` : ''}

${payment.payment_url ? `🔗 Link para pagamento: ${payment.payment_url}` : ''}

Qualquer dúvida, estou à disposição!`;

  const handleOpen = () => {
    setMessage(defaultMessage);
    setIsOpen(true);
  };

  const handleSend = () => {
    if (!patientPhone) {
      alert('Paciente não possui telefone cadastrado');
      return;
    }

    if (!message.trim()) {
      alert('Digite uma mensagem');
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

  if (!patientPhone) {
    return (
      <Button variant="outline" size="sm" disabled>
        <MessageCircle className="w-4 h-4" />
      </Button>
    );
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
          <DialogTitle>Enviar WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Para: {patientName}</Label>
            <p className="text-sm text-gray-600">{patientPhone}</p>
          </div>
          
          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
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
