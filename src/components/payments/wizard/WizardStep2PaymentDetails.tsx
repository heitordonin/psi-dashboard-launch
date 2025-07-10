
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentAmountField } from '@/components/payments/PaymentAmountField';
import { PaymentDescriptionField } from '@/components/payments/PaymentDescriptionField';
import { RetroactiveDateConfirmationDialog } from '@/components/payments/RetroactiveDateConfirmationDialog';
import { validateDueDateReceitaSaude } from '@/utils/receitaSaudeValidation';
import type { WizardFormData } from './types';

interface WizardStep2Props {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

export function WizardStep2PaymentDetails({ formData, updateFormData }: WizardStep2Props) {
  const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState('');
  const [hasRetroactiveWarning, setHasRetroactiveWarning] = useState(false);

  const handlePaymentMethodChange = (method: 'boleto' | 'creditCard', checked: boolean) => {
    updateFormData({
      paymentMethods: {
        ...formData.paymentMethods,
        [method]: checked
      }
    });
  };

  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      updateFormData({ 
        due_date: newDate, 
        retroactiveDateConfirmed: false 
      });
      setHasRetroactiveWarning(false);
      return;
    }

    const validation = validateDueDateReceitaSaude(newDate);
    
    if (!validation.isValid) {
      // Data é retroativa e inválida - mostrar dialog de confirmação
      setPendingDate(newDate);
      setShowRetroactiveDialog(true);
      setHasRetroactiveWarning(true);
    } else {
      // Data é válida - aplicar normalmente
      updateFormData({ 
        due_date: newDate, 
        retroactiveDateConfirmed: false 
      });
      setHasRetroactiveWarning(false);
    }
  };

  const handleConfirmRetroactiveDate = () => {
    updateFormData({ 
      due_date: pendingDate, 
      retroactiveDateConfirmed: true 
    });
    setShowRetroactiveDialog(false);
    setHasRetroactiveWarning(false);
    setPendingDate('');
  };

  const handleCancelRetroactiveDate = () => {
    setShowRetroactiveDialog(false);
    setHasRetroactiveWarning(false);
    setPendingDate('');
  };

  // Reset confirmation if date changes to a valid one
  useEffect(() => {
    if (formData.due_date && formData.retroactiveDateConfirmed) {
      const validation = validateDueDateReceitaSaude(formData.due_date);
      if (validation.isValid) {
        updateFormData({ retroactiveDateConfirmed: false });
      }
    }
  }, [formData.due_date, formData.retroactiveDateConfirmed]);

  // Create input props conditionally to completely omit min attribute for manual charges
  const dateInputProps = {
    id: "due_date",
    type: "date" as const,
    value: formData.due_date,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateFormData({ due_date: e.target.value }),
    ...(formData.chargeType === 'link' && {
      min: new Date().toISOString().split('T')[0]
    })
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Detalhes do Pagamento</h3>
        
        <div className="space-y-4">
          <PaymentAmountField
            value={formData.amount}
            onChange={(value) => updateFormData({ amount: value })}
          />

          <div>
            <Label htmlFor="due_date">Data de Vencimento</Label>
            <Input 
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleDateChange(e.target.value)}
              className={hasRetroactiveWarning ? 'border-orange-500' : ''}
              {...(formData.chargeType === 'link' && {
                min: new Date().toISOString().split('T')[0]
              })}
            />
            {hasRetroactiveWarning && (
              <p className="text-sm text-orange-600 mt-1">
                ⚠️ Data retroativa detectada - aguardando confirmação
              </p>
            )}
          </div>

          <PaymentDescriptionField
            value={formData.description}
            onChange={(value) => updateFormData({ description: value })}
          />

          {/* Only show payment methods for link charges */}
          {formData.chargeType === 'link' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formas de Pagamento</CardTitle>
                <CardDescription>
                  Selecione as formas de pagamento que serão aceitas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="boleto"
                    checked={formData.paymentMethods.boleto}
                    onCheckedChange={(checked) => handlePaymentMethodChange('boleto', !!checked)}
                  />
                  <Label htmlFor="boleto">Boleto Bancário</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="creditCard"
                    checked={formData.paymentMethods.creditCard}
                    onCheckedChange={(checked) => handlePaymentMethodChange('creditCard', !!checked)}
                  />
                  <Label htmlFor="creditCard">Cartão de Crédito</Label>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <RetroactiveDateConfirmationDialog
        isOpen={showRetroactiveDialog}
        onClose={handleCancelRetroactiveDate}
        onConfirm={handleConfirmRetroactiveDate}
        selectedDate={pendingDate}
      />
    </div>
  );
}
