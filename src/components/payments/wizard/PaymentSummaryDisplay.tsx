
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { WizardFormData } from './types';

interface PaymentSummaryDisplayProps {
  formData: WizardFormData;
}

export function PaymentSummaryDisplay({ formData }: PaymentSummaryDisplayProps) {
  const paymentMethods = formData.chargeType === 'link' 
    ? Object.entries(formData.paymentMethods)
        .filter(([_, enabled]) => enabled)
        .map(([method]) => method === 'boleto' ? 'Boleto' : 'Cartão de Crédito')
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalhes da Cobrança</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Tipo de Cobrança:</span>
          <Badge variant={formData.chargeType === 'link' ? 'default' : 'secondary'}>
            {formData.chargeType === 'link' ? 'Com link de pagamento' : 'Manual'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <Badge variant="outline">
            {formData.paymentType === 'single' ? 'Pagamento Único' : 'Assinatura'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Valor:</span>
          <span className="font-medium">R$ {formData.amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Vencimento:</span>
          <span>{format(new Date(formData.due_date), 'dd/MM/yyyy')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Descrição:</span>
          <span className="text-right">{formData.description}</span>
        </div>
        {formData.chargeType === 'link' && paymentMethods.length > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Métodos:</span>
            <span className="text-right">{paymentMethods.join(', ')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
