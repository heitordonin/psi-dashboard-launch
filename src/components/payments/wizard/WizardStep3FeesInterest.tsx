
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WizardFormData } from '../CreatePaymentWizard';

interface WizardStep3FeesInterestProps {
  monthlyInterest: number;
  lateFee: number;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
}

export function WizardStep3FeesInterest({ 
  monthlyInterest, 
  lateFee, 
  updateFormData, 
  onNext 
}: WizardStep3FeesInterestProps) {
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          Juros e Multa
        </h2>
        <p className="text-gray-600">
          Configure penalidades por atraso (opcional)
        </p>
      </div>

      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Estes campos são opcionais. Deixe em branco se não deseja aplicar juros ou multa por atraso.
          </AlertDescription>
        </Alert>

        {/* Monthly Interest */}
        <div className="space-y-2">
          <Label htmlFor="monthlyInterest" className="text-base font-medium">
            Juros (ao mês)
          </Label>
          <div className="relative">
            <Input
              id="monthlyInterest"
              type="number"
              value={monthlyInterest || ''}
              onChange={(e) => updateFormData({ monthlyInterest: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full pr-8"
              min="0"
              max="100"
              step="0.01"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              %
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Percentual de juros aplicado mensalmente após o vencimento
          </p>
        </div>

        {/* Late Fee */}
        <div className="space-y-2">
          <Label htmlFor="lateFee" className="text-base font-medium">
            Multa (após vencimento)
          </Label>
          <div className="relative">
            <Input
              id="lateFee"
              type="number"
              value={lateFee || ''}
              onChange={(e) => updateFormData({ lateFee: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full pr-8"
              min="0"
              max="100"
              step="0.01"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              %
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Percentual de multa aplicado imediatamente após o vencimento
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Exemplo de Cálculo:</h4>
          <p className="text-sm text-gray-600">
            Para uma cobrança de R$ 100,00 com 30 dias de atraso:
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>• Multa: {lateFee || 0}% = R$ {((lateFee || 0) * 1).toFixed(2)}</li>
            <li>• Juros: {monthlyInterest || 0}% = R$ {((monthlyInterest || 0) * 1).toFixed(2)}</li>
            <li>• <strong>Total: R$ {(100 + (lateFee || 0) * 1 + (monthlyInterest || 0) * 1).toFixed(2)}</strong></li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onNext} className="px-8">
          Continuar
        </Button>
      </div>
    </div>
  );
}
