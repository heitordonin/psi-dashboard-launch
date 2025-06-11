
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WizardFormData } from './types';

interface WizardStep3Props {
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
}: WizardStep3Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Juros e Multa</h3>
        
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Cobrança</CardTitle>
            <CardDescription>
              Configure juros e multa para pagamentos em atraso (funcionalidade futura)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="monthlyInterest">Juros Mensal (%)</Label>
              <Input
                id="monthlyInterest"
                type="number"
                step="0.01"
                value={monthlyInterest}
                onChange={(e) => updateFormData({ monthlyInterest: parseFloat(e.target.value) || 0 })}
                placeholder="1,00"
                disabled
              />
              <p className="text-sm text-muted-foreground mt-1">
                Esta funcionalidade estará disponível em breve
              </p>
            </div>

            <div>
              <Label htmlFor="lateFee">Multa por Atraso (%)</Label>
              <Input
                id="lateFee"
                type="number"
                step="0.01"
                value={lateFee}
                onChange={(e) => updateFormData({ lateFee: parseFloat(e.target.value) || 0 })}
                placeholder="2,00"
                disabled
              />
              <p className="text-sm text-muted-foreground mt-1">
                Esta funcionalidade estará disponível em breve
              </p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> A multa por atraso é limitada a 2% e os juros de mora a 1% ao mês, conforme o Código de Defesa do Consumidor.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
