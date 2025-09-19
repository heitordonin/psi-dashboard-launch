import React, { useState } from 'react';
import { Edit2, Mail, Phone, MapPin, CreditCard, CheckCircle, AlertCircle, MoreVertical, Pencil, Trash2, Undo2, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedSkeleton } from '@/components/ui/enhanced-skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/utils/priceFormatter';
import { MobilePatientHeader } from './MobilePatientHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { createSafeDateFromString, getTodayLocalDate } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useWhatsAppLimit } from '@/hooks/useWhatsAppLimit';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentDateModal } from '@/components/payments/PaymentDateModal';
import type { Patient } from '@/types/patient';
import type { PaymentWithPatient, Payment } from '@/types/payment';
interface PatientDetailsProps {
  patient?: Patient;
  charges: PaymentWithPatient[];
  isLoading: boolean;
  onEditPatient: () => void;
  onBack?: () => void;
  onGeneratePayment?: (patientId: string) => void;
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (paymentId: string) => void;
}
export const PatientDetails = ({
  patient,
  charges,
  isLoading,
  onEditPatient,
  onBack,
  onGeneratePayment,
  onEditPayment,
  onDeletePayment
}: PatientDetailsProps) => {
  const isMobile = useIsMobile();
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [pendingPaymentForDate, setPendingPaymentForDate] = useState<string | null>(null);
  const { user } = useAuth();
  const { sendWhatsApp } = useWhatsApp();
  const { canSend: canSendWhatsApp } = useWhatsAppLimit();
  const queryClient = useQueryClient();

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ paymentId, paidDate }: { paymentId: string; paidDate: Date }) => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_date: paidDate.toISOString()
        })
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-charges'] });
      toast.success('Cobrança marcada como paga!');
      setSelectedPaymentId(null);
      setIsDateModalOpen(false);
      setPendingPaymentForDate(null);
    },
    onError: (error) => {
      console.error('Error marking payment as paid:', error);
      toast.error('Erro ao marcar cobrança como paga');
      setIsDateModalOpen(false);
      setPendingPaymentForDate(null);
    }
  });

  // Mark as unpaid mutation
  const markAsUnpaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'pending',
          paid_date: null
        })
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-charges'] });
      toast.success('Cobrança marcada como pendente!');
      setSelectedPaymentId(null);
    },
    onError: (error) => {
      console.error('Error marking payment as unpaid:', error);
      toast.error('Erro ao marcar cobrança como pendente');
    }
  });

  // Email reminder mutation
  const sendEmailReminderMutation = useMutation({
    mutationFn: async (payment: PaymentWithPatient) => {
      // Validate email exists
      if (!payment.patients?.email) {
        throw new Error('Paciente não possui email cadastrado');
      }

      const { error } = await supabase.functions.invoke('send-email-reminder', {
        body: { 
          paymentId: payment.id,
          patientEmail: payment.patients.email,
          patientName: payment.patients.full_name,
          amount: payment.amount,
          dueDate: payment.due_date,
          description: payment.description
        }
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lembrete enviado por email!');
      setSelectedPaymentId(null);
    },
    onError: (error) => {
      console.error('Error sending email reminder:', error);
      if (error.message?.includes('email cadastrado')) {
        toast.error('Paciente não possui email cadastrado');
      } else {
        toast.error('Erro ao enviar lembrete por email');
      }
    }
  });

  // WhatsApp reminder handler
  const handleSendWhatsApp = async (payment: PaymentWithPatient) => {
    if (!canSendWhatsApp) {
      toast.error('Limite de mensagens WhatsApp atingido');
      return;
    }

    if (!payment.patients?.phone) {
      toast.error('Paciente não possui telefone cadastrado');
      return;
    }

    try {
      await sendWhatsApp({
        to: payment.patients.phone,
        message: `Olá ${payment.patients.full_name}! Você possui uma cobrança de ${formatCurrency(payment.amount)} com vencimento em ${createSafeDateFromString(payment.due_date).toLocaleDateString('pt-BR')}. ${payment.description || ''}`,
        paymentId: payment.id
      });
      setSelectedPaymentId(null);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  };

  // Handlers for date modal
  const handleMarkAsPaid = (paymentId: string) => {
    setPendingPaymentForDate(paymentId);
    setIsDateModalOpen(true);
  };

  const handleConfirmPayment = (date: Date) => {
    if (pendingPaymentForDate) {
      markAsPaidMutation.mutate({ paymentId: pendingPaymentForDate, paidDate: date });
    }
  };

  const handleCloseDateModal = () => {
    setIsDateModalOpen(false);
    setPendingPaymentForDate(null);
  };
  if (!patient) {
    if (isMobile) {
      return null; // Don't show placeholder on mobile
    }
    return <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <div className="text-gray-400 mb-4">
            <CreditCard className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-600">
            Selecione um paciente na lista ao lado para ver seus detalhes
          </p>
        </CardContent>
      </Card>;
  }

  // Filter charges for this patient
  const patientCharges = charges.filter(charge => charge.patient_id === patient.id);

  // Separate pending and paid charges
  const pendingCharges = patientCharges.filter(charge => charge.status === 'pending');
  const paidCharges = patientCharges.filter(charge => charge.status === 'paid');

  // Calculate overdue charges
  const today = getTodayLocalDate();
  const overdueCharges = pendingCharges.filter(charge => createSafeDateFromString(charge.due_date) < today);

  // Calculate totals
  const totalPending = pendingCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
  const totalPaid = paidCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
  const totalOverdue = overdueCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
  const documentLabel = patient.patient_type === 'company' ? 'CNPJ' : 'CPF';
  const documentValue = patient.patient_type === 'company' ? patient.cnpj : patient.cpf;
  
  // Safe date formatting function
  const formatDate = (dateString: string): string => {
    return createSafeDateFromString(dateString).toLocaleDateString('pt-BR');
  };
  
  const truncateDescription = (description: string, maxLength: number = 20): string => {
    if (!description || description.length <= maxLength) return description || 'Sem descrição';
    return description.substring(0, maxLength) + '...';
  };
  // Helper function to render payment action menu items
  const renderPaymentMenuItems = (charge: PaymentWithPatient) => {
    const isBlockedByReceitaSaude = charge.receita_saude_receipt_issued;
    const canMarkPaid = charge.status !== 'paid' && !charge.has_payment_link && !isBlockedByReceitaSaude;
    const canMarkUnpaid = (charge.status === 'paid' || charge.paid_date) && !isBlockedByReceitaSaude;
    const canEdit = !(charge.has_payment_link || isBlockedByReceitaSaude);
    const canDelete = !(charge.status === 'paid' || isBlockedByReceitaSaude);
    const canSendEmail = charge.status === 'pending' && !!charge.patients?.email && charge.patients.email.includes('@');
    const canSendWhatsAppMsg = charge.status === 'pending' && !!charge.patients?.phone && canSendWhatsApp;

    return (
      <>
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
          <DropdownMenuItem onClick={() => handleMarkAsPaid(charge.id)} className="min-h-[40px]" disabled={markAsPaidMutation.isPending}>
            {markAsPaidMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Marcar como Pago
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onClick={() => sendEmailReminderMutation.mutate(charge)} 
          disabled={!canSendEmail || sendEmailReminderMutation.isPending} 
          className="min-h-[40px]"
        >
          {sendEmailReminderMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          Lembrete Email
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleSendWhatsApp(charge)} 
          disabled={!canSendWhatsAppMsg} 
          className="min-h-[40px]"
        >
          <MessageCircle className="h-4 w-4 mr-2" /> Lembrete WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditPayment?.(charge)} disabled={!canEdit} className="min-h-[40px]">
          <Pencil className="h-4 w-4 mr-2" /> Editar
        </DropdownMenuItem>
        {(charge.status === 'paid' || charge.paid_date) && (
          <DropdownMenuItem 
            onClick={() => markAsUnpaidMutation.mutate(charge.id)} 
            disabled={!canMarkUnpaid || markAsUnpaidMutation.isPending} 
            className={`min-h-[40px] ${!canMarkUnpaid ? 'opacity-50' : ''}`}
          >
            {markAsUnpaidMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Undo2 className="h-4 w-4 mr-2" />
            )}
            Marcar como não pago
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onDeletePayment?.(charge.id)} disabled={!canDelete} className="text-red-600 min-h-[40px]">
          <Trash2 className="h-4 w-4 mr-2" /> Excluir
        </DropdownMenuItem>
      </>
    );
  };

  const LoadingState = () => (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <EnhancedSkeleton variant="shimmer" className="h-8 w-48" />
        <EnhancedSkeleton variant="pulse" className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <EnhancedSkeleton variant="shimmer" className="h-24 rounded-lg" />
        <EnhancedSkeleton variant="pulse" className="h-24 rounded-lg" />
      </div>
    </div>
  );
  if (isLoading) {
    return <Card className="h-full">
        <LoadingState />
      </Card>;
  }
  const PendingChargesTable = ({
    charges
  }: {
    charges: PaymentWithPatient[];
  }) => <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-3 gap-2 pb-2 border-b text-sm font-medium text-muted-foreground">
        <div>Descrição</div>
        <div className="text-center">Vencimento</div>
        <div className="text-right">Valor</div>
      </div>
      
      {/* Rows */}
      <div className="space-y-1">
        {charges.map(charge => {
        const isOverdue = createSafeDateFromString(charge.due_date) < getTodayLocalDate();
        return <DropdownMenu key={charge.id} open={selectedPaymentId === charge.id} onOpenChange={(open) => setSelectedPaymentId(open ? charge.id : null)}>
              <DropdownMenuTrigger asChild>
                <div 
                  className="grid grid-cols-3 gap-2 py-3 px-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30 items-center cursor-pointer"
                >
                  <div className={`text-sm ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                    {truncateDescription(charge.description || '', 25)}
                  </div>
                  <div className={`text-sm text-center ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {formatDate(charge.due_date)}
                  </div>
                  <div className={`text-sm text-right font-medium ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                    {formatCurrency(charge.amount)}
                  </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border shadow-lg min-w-[180px] z-50">
              {renderPaymentMenuItems(charge)}
            </DropdownMenuContent>
            </DropdownMenu>;
      })}
      </div>
    </div>;
  const PaidChargesTable = ({
    charges
  }: {
    charges: PaymentWithPatient[];
  }) => <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-3 gap-2 pb-2 border-b text-sm font-medium text-muted-foreground">
        <div>Descrição</div>
        <div className="text-center">Pagamento</div>
        <div className="text-right">Valor</div>
      </div>
      
      {/* Rows */}
      <div className="space-y-1">
        {charges.map(charge => <DropdownMenu key={charge.id} open={selectedPaymentId === charge.id} onOpenChange={(open) => setSelectedPaymentId(open ? charge.id : null)}>
            <DropdownMenuTrigger asChild>
              <div 
                className="grid grid-cols-3 gap-2 py-3 px-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30 items-center cursor-pointer"
              >
                <div className="text-sm text-foreground">
                  {truncateDescription(charge.description || '', 25)}
                </div>
                <div className="text-sm text-center text-muted-foreground">
                  {charge.paid_date ? formatDate(charge.paid_date) : '-'}
                </div>
                <div className="text-sm text-right font-medium text-foreground">
                  {formatCurrency(charge.amount)}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border shadow-lg min-w-[180px] z-50">
              {renderPaymentMenuItems(charge)}
            </DropdownMenuContent>
          </DropdownMenu>)}
      </div>
    </div>;
  return <>
      {/* Mobile Header */}
      {isMobile && onBack && <MobilePatientHeader patient={patient} onBack={onBack} onEdit={onEditPatient} />}

      <Card className="flex flex-col">
        {/* Desktop Header */}
        {!isMobile && <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{patient.full_name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {documentLabel}: {documentValue}
                </p>
              </div>
              <Button onClick={onEditPatient} size="sm" variant="outline">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </CardHeader>}

      <CardContent className="flex-1 space-y-6">
        {/* Patient Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-3">Informações Básicas</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{patient.email || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{patient.phone || 'Não informado'}</span>
                </div>
                {(patient.street || patient.city) && <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>
                      {[patient.street, patient.street_number, patient.neighborhood, patient.city, patient.state].filter(Boolean).join(', ') || 'Não informado'}
                    </span>
                  </div>}
                <div className="text-sm">
                  <span className="font-medium">Tipo: </span>
                  {patient.patient_type === 'individual' ? 'Pessoa Física' : 'Empresa'}
                </div>
                {patient.has_financial_guardian && <Badge variant="secondary" className="text-xs">
                    Possui responsável financeiro
                  </Badge>}
                {patient.is_payment_from_abroad && <Badge variant="outline" className="text-xs">
                    Pagamento do exterior
                  </Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-3">Resumo Financeiro</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">A receber:</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(totalPending)}
                  </span>
                </div>
                {totalOverdue > 0 && <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Vencidas:</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(totalOverdue)}
                    </span>
                  </div>}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recebido:</span>
                  <span className="font-semibold text-blue-700">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charges Sections */}
        <div className="grid grid-cols-1 gap-4 flex-1 overflow-hidden">
          {/* Pending Charges */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <CardTitle className="text-base">Cobranças a Receber</CardTitle>
                </div>
                <button 
                  onClick={() => onGeneratePayment?.(patient.id)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  + Gerar nova cobrança
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-full overflow-y-auto px-6 pb-6">
                {pendingCharges.length === 0 ? <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Nenhuma cobrança pendente
                    </p>
                  </div> : <PendingChargesTable charges={[...overdueCharges, ...pendingCharges.filter(charge => !overdueCharges.includes(charge))]} />}
              </div>
            </CardContent>
          </Card>

          {/* Paid Charges */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <CardTitle className="text-base">Cobranças Recebidas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <div className="h-full overflow-y-auto px-6 pb-6">
                {paidCharges.length === 0 ? <div className="text-center py-6">
                    <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    
                  </div> : <PaidChargesTable charges={paidCharges} />}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      </Card>

      <PaymentDateModal
        isOpen={isDateModalOpen}
        onClose={handleCloseDateModal}
        onConfirm={handleConfirmPayment}
        isLoading={markAsPaidMutation.isPending}
      />
    </>;
};