
import { useState } from "react";
import { CheckCircle, Pencil, Trash2, Undo2, MoreVertical, Mail, MessageCircle, Link as LinkIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { PaymentLinkModal } from "./PaymentLinkModal";
import { PaymentLinkButton } from "./PaymentLinkButton";
import { EmailReminderButton } from "./EmailReminderButton";
import { WhatsAppButton } from "./WhatsAppButton";
import { WhatsAppConfirmationDialog } from "./WhatsAppConfirmationDialog";
import { PaymentDateModal } from "./PaymentDateModal";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useWhatsAppLimit } from "@/hooks/useWhatsAppLimit";
import { formatCurrency } from "@/utils/priceFormatter";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentActionsProps {
  payment: PaymentWithPatient;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
  layout?: 'default' | 'compact' | 'paid-only';
}

export function PaymentActions({ payment, onEdit, onDelete, layout = 'default' }: PaymentActionsProps) {
  const queryClient = useQueryClient();
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);
  
  // WhatsApp hooks
  const { user } = useAuth();
  const { sendWhatsApp, isLoading: isSendingWhatsApp } = useWhatsApp();
  const { canSend: canSendWhatsApp, hasWhatsAppAccess, messagesRemaining, planSlug } = useWhatsAppLimit();
  
  // Calculate display status for overdue payments
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to the beginning of the day

  const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < today;
  const displayStatus = isOverdue ? 'overdue' : payment.status;

  // Check if payment is blocked due to receita saude receipt
  const isBlockedByReceitaSaude = payment.receita_saude_receipt_issued;

  const markAsPaidMutation = useMutation({
    mutationFn: async (paidDate: string) => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_date: paidDate
        })
        .eq('id', payment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-charges'] });
      toast.success('Pagamento marcado como pago!');
      setIsMarkingAsPaid(false);
      setIsDateModalOpen(false);
    },
    onError: (error) => {
      console.error('Error marking payment as paid:', error);
      toast.error('Erro ao marcar pagamento como pago');
      setIsMarkingAsPaid(false);
      setIsDateModalOpen(false);
    }
  });

  const markAsUnpaidMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'pending',
          paid_date: null
        })
        .eq('id', payment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-charges'] });
      toast.success('Cobrança marcada como pendente!');
    },
    onError: (error) => {
      console.error('Error marking payment as unpaid:', error);
      toast.error('Erro ao marcar cobrança como pendente');
    }
  });

  const handleMarkAsPaid = () => {
    if (payment.status === 'paid') return;
    setIsDateModalOpen(true);
  };

  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleConfirmPayment = (date: Date) => {
    setIsMarkingAsPaid(true);
    const paidDate = formatDateForDatabase(date);
    markAsPaidMutation.mutate(paidDate);
  };

  const handleMarkAsUnpaid = () => {
    if (!canMarkUnpaid) {
      setIsExplanationDialogOpen(true);
      return;
    }
    markAsUnpaidMutation.mutate();
  };

  // Email reminder handler (compact mode)
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const handleSendEmail = async () => {
    if (!payment.patients || !payment.patients.full_name) {
      toast.error('Paciente não encontrado');
      return;
    }
    const recipientEmail = payment.patients.email;
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Email não está cadastrado para este paciente. Por favor, atualize o cadastro do paciente para incluir um email válido.');
      return;
    }
    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-email-reminder', {
        body: {
          paymentId: payment.id,
          recipientEmail,
          amount: payment.amount,
          patientName: payment.patients.full_name,
          dueDate: payment.due_date,
          description: payment.description
        }
      });
      if (error) {
        console.error('Error sending email reminder:', error);
        toast.error('Erro ao enviar lembrete por email');
      } else {
        await supabase
          .from('payments')
          .update({ email_reminder_sent_at: new Date().toISOString() })
          .eq('id', payment.id);
        toast.success('Lembrete enviado por email com sucesso!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar lembrete por email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // WhatsApp handler (compact mode)
  const handleSendWhatsApp = () => {
    if (!payment.patients?.phone) {
      toast.error('Paciente não tem telefone cadastrado');
      return;
    }

    if (!hasWhatsAppAccess) {
      toast.error('Acesso ao WhatsApp não disponível no seu plano');
      return;
    }

    if (!canSendWhatsApp) {
      toast.error('Limite de mensagens WhatsApp atingido');
      return;
    }

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    // Garante que temos um nome de psicólogo para a mensagem
    const psychologistName = user?.user_metadata?.full_name || "seu psicólogo(a)";

    // Usar formato de variáveis numeradas como no WhatsAppButton
    const templateVariables = {
      "1": payment.patients.full_name,
      "2": psychologistName,
      "3": formatCurrency(payment.amount),
      "4": formatDate(payment.due_date)
    };

    sendWhatsApp({
      to: payment.patients.phone,
      templateSid: 'TWILIO_TEMPLATE_SID_LEMBRETE',
      templateVariables,
      paymentId: payment.id,
      messageType: 'payment_reminder'
    });
  };

  const canMarkPaid = payment.status !== 'paid' && !payment.has_payment_link && !isBlockedByReceitaSaude;
  const canMarkUnpaid = (payment.status === 'paid' || payment.paid_date) && !isBlockedByReceitaSaude;
  
  // DEBUG: Log para investigar por que canMarkUnpaid é false
  if (payment.status === 'paid' || payment.paid_date) {
    console.log('🔍 Investigando canMarkUnpaid para pagamento:', {
      paymentId: payment.id,
      patientName: payment.patients?.full_name,
      status: payment.status,
      paid_date: payment.paid_date,
      receita_saude_receipt_issued: payment.receita_saude_receipt_issued,
      isBlockedByReceitaSaude,
      canMarkUnpaid
    });
  }
  const canEdit = !(payment.has_payment_link || isBlockedByReceitaSaude);
  const canDelete = !(payment.status === 'paid' || isBlockedByReceitaSaude);
  const canOpenLink = payment.has_payment_link && payment.status === 'pending';
  const canSendEmail = payment.status === 'pending' && !!payment.patients?.email && payment.patients.email.includes('@');

  // Paid-only layout: Only mark as unpaid option
  if (layout === 'paid-only') {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="touch-target">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border shadow-lg min-w-[180px] z-50">
            {/* Receita Saúde Status Warning */}
            {isBlockedByReceitaSaude && (
              <>
                <div className="px-3 py-2 bg-orange-50 border-l-4 border-orange-400 mx-1 my-1 rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-800">
                      Receita Saúde Emitida
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Algumas ações estão bloqueadas
                  </p>
                </div>
                <div className="h-px bg-border my-1" />
              </>
            )}
            {canMarkUnpaid && (
              <DropdownMenuItem onClick={handleMarkAsUnpaid} className="min-h-[40px]">
                <Undo2 className="h-4 w-4 mr-2" /> Marcar como não pago
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <PaymentDateModal
          isOpen={isDateModalOpen}
          onClose={() => setIsDateModalOpen(false)}
          onConfirm={handleConfirmPayment}
          isLoading={isMarkingAsPaid}
        />
      </div>
    );
  }

  // Compact layout: CTA + menu
  if (layout === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="touch-target">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border shadow-lg min-w-[180px] z-50">
            {/* Receita Saúde Status Warning */}
            {isBlockedByReceitaSaude && (
              <>
                <div className="px-3 py-2 bg-orange-50 border-l-4 border-orange-400 mx-1 my-1 rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-800">
                      Receita Saúde Emitida
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Algumas ações estão bloqueadas
                  </p>
                </div>
                <div className="h-px bg-border my-1" />
              </>
            )}
            {canMarkPaid && (
              <DropdownMenuItem onClick={handleMarkAsPaid} disabled={isMarkingAsPaid} className="min-h-[40px]">
                {isMarkingAsPaid ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />} Marcar como Pago
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleSendEmail} disabled={!canSendEmail || isSendingEmail} className="min-h-[40px]">
              {isSendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />} Lembrete Email
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsWhatsAppDialogOpen(true)} 
              disabled={!hasWhatsAppAccess || !payment.patients?.phone || payment.status !== 'pending' || !canSendWhatsApp || isSendingWhatsApp} 
              className="min-h-[40px]"
            >
              {isSendingWhatsApp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />} Lembrete WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(payment)} disabled={!canEdit} className="min-h-[40px]">
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
            {/* Always show the mark as unpaid option for paid payments */}
            {(payment.status === 'paid' || payment.paid_date) && (
              <DropdownMenuItem 
                onClick={handleMarkAsUnpaid} 
                disabled={!canMarkUnpaid} 
                className={`min-h-[40px] ${!canMarkUnpaid ? 'opacity-50' : ''}`}
              >
                <Undo2 className="h-4 w-4 mr-2" /> Marcar como não pago
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(payment.id)} disabled={!canDelete} className="text-red-600 min-h-[40px]">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Payment Link Dialog */}
        <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
          <DialogContent>
            <PaymentLinkModal
              isOpen={isLinkOpen}
              onClose={() => setIsLinkOpen(false)}
              paymentUrl={payment.payment_url}
              pixQrCode={payment.pix_qr_code}
            />
          </DialogContent>
        </Dialog>

        <PaymentDateModal
          isOpen={isDateModalOpen}
          onClose={() => setIsDateModalOpen(false)}
          onConfirm={handleConfirmPayment}
          isLoading={isMarkingAsPaid}
        />

        {/* WhatsApp Confirmation Dialog */}
        <WhatsAppConfirmationDialog
          isOpen={isWhatsAppDialogOpen}
          onClose={() => setIsWhatsAppDialogOpen(false)}
          onConfirm={handleSendWhatsApp}
          payment={payment}
          planSlug={planSlug}
          messagesRemaining={messagesRemaining}
        />

        {/* Explanation Dialog */}
        <Dialog open={isExplanationDialogOpen} onOpenChange={setIsExplanationDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-orange-600">❌ Operação Bloqueada</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3">
                  <p className="text-sm">
                    O recibo da Receita Saúde já foi emitido para este pagamento.
                  </p>
                  <div>
                    <p className="text-sm font-medium mb-2">📝 Para permitir alterações:</p>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Acesse 'Controle Receita Saúde'</li>
                      <li>Desmarque o recibo deste pagamento</li>
                      <li>Retorne aqui - a opção ficará disponível</li>
                    </ol>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setIsExplanationDialogOpen(false)}>
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default (existing) layout
  return (
    <div className="space-y-4">
      {/* Status and badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <PaymentStatusBadge status={displayStatus} />
        {payment.has_payment_link && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Com link de cobrança
          </Badge>
        )}
        {isBlockedByReceitaSaude && (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            Recibo Emitido
          </Badge>
        )}
      </div>

      {/* Main action buttons row */}
      <div className="flex flex-wrap gap-2">
        {/* Mark as Paid/Unpaid button */}
        {payment.status !== 'paid' && !payment.has_payment_link && !isBlockedByReceitaSaude && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsPaid}
            disabled={isMarkingAsPaid}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Marcar como Pago
          </Button>
        )}

        {payment.status === 'paid' && !payment.has_payment_link && !isBlockedByReceitaSaude && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsUnpaid}
            disabled={markAsUnpaidMutation.isPending}
          >
            <Undo2 className="w-4 h-4 mr-1" />
            Marcar como não pago
          </Button>
        )}

        {/* Blocked mark as unpaid button with tooltip */}
        {payment.status === 'paid' && isBlockedByReceitaSaude && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={true}
                  >
                    <Undo2 className="w-4 h-4 mr-1" />
                    Marcar como não pago
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-medium text-orange-600 mb-2">❌ Recibo da Receita Saúde já foi emitido</p>
                  <p className="text-sm mb-1">📝 Para permitir alterações:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Acesse 'Controle Receita Saúde'</li>
                    <li>Desmarque o recibo deste pagamento</li>
                    <li>Retorne aqui - a opção ficará disponível</li>
                  </ol>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Payment link button */}
        {payment.has_payment_link && payment.status === 'pending' && (
          <PaymentLinkButton payment={payment} />
        )}
      </div>

      {/* Communication buttons row */}
      <div className="flex flex-wrap gap-2">
        <EmailReminderButton payment={payment} />
        <WhatsAppButton payment={payment} />
      </div>

      {/* Edit/Delete actions row */}
      <div className="flex gap-2">
        {/* Edit button with tooltip when disabled */}
        {(payment.has_payment_link || isBlockedByReceitaSaude) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="ghost" size="sm" disabled={true}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {payment.has_payment_link 
                    ? "Não é possível editar uma cobrança com link de pagamento."
                    : "Não é possível editar uma cobrança com recibo emitido. Desmarque no Controle Receita Saúde para permitir alterações."
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(payment)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
        )}
        
        {/* Delete button with tooltip when disabled */}
        {(payment.status === 'paid' || isBlockedByReceitaSaude) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="ghost" size="sm" className="text-red-600" disabled={true}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {payment.status === 'paid' && isBlockedByReceitaSaude
                    ? "Não é possível excluir uma cobrança paga com recibo emitido."
                    : payment.status === 'paid'
                    ? "Não é possível excluir uma cobrança já recebida."
                    : "Não é possível excluir uma cobrança com recibo emitido. Desmarque no Controle Receita Saúde para permitir alterações."
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => onDelete(payment.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        )}
      </div>

      <PaymentDateModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        onConfirm={handleConfirmPayment}
        isLoading={isMarkingAsPaid}
      />
    </div>
  );
}
