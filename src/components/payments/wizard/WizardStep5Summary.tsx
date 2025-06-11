
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, QrCode, Mail, MailX } from 'lucide-react';
import { usePaymentFormMutations } from '../PaymentFormMutations';
import { toast } from 'sonner';
import type { WizardFormData } from '../CreatePaymentWizard';
import type { Patient } from '@/types/patient';

interface WizardStep5SummaryProps {
  formData: WizardFormData;
  patients: Patient[];
  onSuccess?: () => void;
  onClose: () => void;
}

export function WizardStep5Summary({ 
  formData, 
  patients, 
  onSuccess, 
  onClose 
}: WizardStep5SummaryProps) {
  const { createPaymentMutation } = usePaymentFormMutations();
  
  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  const handleCreatePayment = async () => {
    if (!selectedPatient) {
      toast.error('Paciente não encontrado');
      return;
    }

    // Transform wizard data to payment form format
    const paymentData = {
      patient_id: formData.patient_id,
      amount: formData.amount,
      due_date: formData.due_date,
      description: formData.description,
      payer_cpf: formData.paymentTitular === 'other' ? formData.payer_cpf : '',
      status: formData.isReceived ? 'paid' as const : 'pending' as const,
      received_date: formData.isReceived ? formData.receivedDate : null
    };

    try {
      await createPaymentMutation.mutateAsync({
        paymentData,
        isReceived: formData.isReceived,
        receivedDate: formData.receivedDate,
        paymentTitular: formData.paymentTitular
      });

      toast.success('Cobrança criada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Erro ao criar cobrança');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getPaymentMethods = () => {
    const methods = [];
    if (formData.paymentMethods.boleto) methods.push('Boleto/PIX');
    if (formData.paymentMethods.creditCard) methods.push('Cartão');
    return methods.join(', ') || 'Nenhuma selecionada';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-semibold text-gray-900">
          Confirme os Dados
        </h2>
        <p className="text-gray-600">
          Revise todas as informações antes de criar a cobrança
        </p>
      </div>

      <div className="space-y-4">
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes do Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor:</span>
              <span className="font-semibold text-lg">{formatCurrency(formData.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vencimento:</span>
              <span className="font-medium">{formatDate(formData.due_date)}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-600">Descrição:</span>
              <span className="font-medium text-right max-w-xs">
                {formData.description || 'Sem descrição'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Formas de pagamento:</span>
              <div className="flex gap-2">
                {formData.paymentMethods.boleto && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    Boleto/PIX
                  </Badge>
                )}
                {formData.paymentMethods.creditCard && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Cartão
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fees & Interest */}
        {(formData.monthlyInterest > 0 || formData.lateFee > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Juros e Multa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.monthlyInterest > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Juros (ao mês):</span>
                  <span className="font-medium">{formData.monthlyInterest}%</span>
                </div>
              )}
              {formData.lateFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Multa:</span>
                  <span className="font-medium">{formData.lateFee}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Pagador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Paciente:</span>
              <span className="font-medium">{selectedPatient?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Documento:</span>
              <span className="font-medium">
                {selectedPatient?.cpf || selectedPatient?.cnpj || 'Não informado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Responsável pelo pagamento:</span>
              <span className="font-medium">
                {formData.paymentTitular === 'patient' ? 'Próprio paciente' : 'Outra pessoa'}
              </span>
            </div>
            {formData.paymentTitular === 'other' && (
              <div className="flex justify-between">
                <span className="text-gray-600">CPF do responsável:</span>
                <span className="font-medium">{formData.payer_cpf}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Envio por e-mail:</span>
              <div className="flex items-center gap-2">
                {formData.sendEmailNotification ? (
                  <>
                    <Mail className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-600">Sim</span>
                  </>
                ) : (
                  <>
                    <MailX className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Não</span>
                  </>
                )}
              </div>
            </div>
            {formData.sendEmailNotification && formData.email && (
              <div className="flex justify-between">
                <span className="text-gray-600">E-mail:</span>
                <span className="font-medium">{formData.email}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={createPaymentMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleCreatePayment}
          className="flex-1"
          disabled={createPaymentMutation.isPending}
        >
          {createPaymentMutation.isPending ? 'Criando...' : 'Criar Cobrança'}
        </Button>
      </div>
    </div>
  );
}
