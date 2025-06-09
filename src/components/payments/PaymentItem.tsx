
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Copy, Calendar, User, FileText, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentButtons } from "./PaymentButtons";
import { toast } from "sonner";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentItemProps {
  payment: PaymentWithPatient;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
}

export function PaymentItem({ payment, onEdit, onDelete }: PaymentItemProps) {
  const queryClient = useQueryClient();
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado para a área de transferência!`);
    } catch (err) {
      toast.error('Erro ao copiar para a área de transferência');
    }
  };

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', payment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pagamento marcado como pago!');
    },
    onError: (error) => {
      console.error('Error marking payment as paid:', error);
      toast.error('Erro ao marcar pagamento como pago');
    }
  });

  const handleMarkAsPaid = () => {
    if (payment.status === 'paid') return;
    setIsMarkingAsPaid(true);
    markAsPaidMutation.mutate();
    setIsMarkingAsPaid(false);
  };

  const handleCopyPixKey = () => {
    const pixKey = "chavepix@exemplo.com";
    copyToClipboard(pixKey, "Chave PIX");
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* Left side - Main info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">
                  {payment.patients?.full_name || 'Paciente não encontrado'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(payment.patients?.full_name || '', 'Nome do paciente')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-600">
                  {formatCurrency(Number(payment.amount))}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(Number(payment.amount).toFixed(2).replace('.', ','), 'Valor')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Vencimento: {formatDate(payment.due_date)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(formatDate(payment.due_date), 'Data de vencimento')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              {payment.paid_date && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Pago em: {formatDate(payment.paid_date)}</span>
                </div>
              )}

              {payment.description && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 truncate">{payment.description}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(payment.description!, 'Descrição')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {payment.payment_url && (
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <a 
                  href={payment.payment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Link de pagamento
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(payment.payment_url!, 'Link de pagamento')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex items-center gap-2">
              <Button
                variant={payment.status === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={handleMarkAsPaid}
                disabled={isMarkingAsPaid || payment.status === 'paid'}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {payment.status === 'paid' ? 'Pago' : 'Marcar como Pago'}
              </Button>
            </div>

            {/* Use PaymentButtons component */}
            <PaymentButtons
              payment={payment}
              onEdit={onEdit}
              onDelete={onDelete}
            />

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyPixKey}>
                PIX
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
