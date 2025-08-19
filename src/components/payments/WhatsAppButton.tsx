
import { useState } from "react";
import { MessageCircle, AlertTriangle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useWhatsAppLimit } from "@/hooks/useWhatsAppLimit";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { WhatsAppConfirmationDialog } from "./WhatsAppConfirmationDialog";
import type { PaymentWithPatient } from "@/types/payment";
import { format } from "date-fns";

interface WhatsAppButtonProps {
  payment: PaymentWithPatient;
}

export function WhatsAppButton({ payment }: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { sendWhatsApp, isLoading } = useWhatsApp();
  const { 
    canSend, 
    messagesUsed, 
    messagesRemaining, 
    totalAllowed, 
    hasWhatsAppAccess, 
    isUnlimited, 
    planSlug 
  } = useWhatsAppLimit();
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
    if (!patientPhone || !canSend) {
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

  // Verificar se tem acesso ao WhatsApp baseado no plano
  if (!hasWhatsAppAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled>
              <MessageCircle className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span>WhatsApp disponível nos planos Gestão e Psi Regular</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Verificar se atingiu o limite (apenas para plano Gestão)
  if (!canSend && planSlug === 'gestao') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled>
              <MessageCircle className="w-4 h-4 opacity-50" />
              <AlertTriangle className="w-3 h-3 text-amber-500 ml-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Limite de mensagens atingido</p>
              <p className="text-xs">Você utilizou {messagesUsed}/{totalAllowed} mensagens este mês</p>
              <p className="text-xs text-muted-foreground">
                Renovação no próximo mês ou upgrade para Psi Regular
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Mostrar tooltip informativo para plano Gestão
  if (planSlug === 'gestao' && !isUnlimited) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isLoading || !canSend}
                onClick={() => setIsOpen(true)}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="ml-1 text-xs text-muted-foreground">
                  {messagesRemaining}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p>Enviar lembrete WhatsApp</p>
                <p className="text-xs text-muted-foreground">
                  {messagesUsed}/{totalAllowed} mensagens utilizadas este mês
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <WhatsAppConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={handleSend}
          payment={payment}
          isLoading={isLoading}
          planSlug={planSlug}
          messagesRemaining={messagesRemaining}
          isUnlimited={isUnlimited}
        />
      </>
    );
  }

  // Para plano Psi Regular (ilimitado) - comportamento simples
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        disabled={isLoading || !canSend}
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      
      <WhatsAppConfirmationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleSend}
        payment={payment}
        isLoading={isLoading}
        planSlug={planSlug}
        messagesRemaining={messagesRemaining}
        isUnlimited={isUnlimited}
      />
    </>
  );
}
