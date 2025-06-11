
import React from 'react';
import { Button } from '@/components/ui/button';
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
                placeholder="0,00"
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
                placeholder="0,00"
                disabled
              />
              <p className="text-sm text-muted-foreground mt-1">
                Esta funcionalidade estará disponível em breve
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>
          Próximo
        </Button>
      </div>
    </div>
  );
}
