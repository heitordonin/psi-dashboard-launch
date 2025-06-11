
import React from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CreditCard, QrCode, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PaymentAmountField } from '@/components/payments/PaymentAmountField';
import { PaymentDescriptionField } from '@/components/payments/PaymentDescriptionField';
import { Button } from '@/components/ui/button';
import type { WizardFormData } from './types';

interface WizardStep2Props {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
}

export function WizardStep2PaymentDetails({
  formData,
  updateFormData,
  onNext
}: WizardStep2Props) {
  const togglePaymentMethod = (method: 'boleto' | 'creditCard') => {
    updateFormData({
      paymentMethods: {
        ...formData.paymentMethods,
        [method]: !formData.paymentMethods[method]
      }
    });
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
            <Label htmlFor="due_date">Data de Vencimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(new Date(formData.due_date), "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date ? new Date(formData.due_date) : undefined}
                  onSelect={(date) => updateFormData({ due_date: date?.toISOString().split('T')[0] || '' })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <PaymentDescriptionField
            value={formData.description}
            onChange={(value) => updateFormData({ description: value })}
          />

          <div>
            <Label className="text-base font-medium">Métodos de Pagamento</Label>
            <p className="text-sm text-muted-foreground mb-3">Selecione os métodos que o cliente poderá usar</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => togglePaymentMethod('boleto')}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all hover:border-primary/50",
                  formData.paymentMethods.boleto
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "rounded-full p-2",
                    formData.paymentMethods.boleto ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Boleto</div>
                    <div className="text-xs text-muted-foreground">Pagamento bancário</div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => togglePaymentMethod('creditCard')}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all hover:border-primary/50",
                  formData.paymentMethods.creditCard
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "rounded-full p-2",
                    formData.paymentMethods.creditCard ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Cartão de Crédito</div>
                    <div className="text-xs text-muted-foreground">Pagamento online</div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50 opacity-60">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full p-2 bg-muted">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">PIX</div>
                    <div className="text-xs text-muted-foreground">Em breve</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
