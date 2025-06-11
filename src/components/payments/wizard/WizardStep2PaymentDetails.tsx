
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PaymentAmountField } from '@/components/payments/PaymentAmountField';
import { PaymentDescriptionField } from '@/components/payments/PaymentDescriptionField';
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
  const handleNext = () => {
    if (formData.amount > 0 && formData.due_date && formData.description) {
      onNext();
    }
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
            <Label>Métodos de Pagamento</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="boleto"
                  checked={formData.paymentMethods.boleto}
                  onCheckedChange={(checked) =>
                    updateFormData({
                      paymentMethods: {
                        ...formData.paymentMethods,
                        boleto: !!checked
                      }
                    })
                  }
                />
                <Label htmlFor="boleto">Boleto</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="creditCard"
                  checked={formData.paymentMethods.creditCard}
                  onCheckedChange={(checked) =>
                    updateFormData({
                      paymentMethods: {
                        ...formData.paymentMethods,
                        creditCard: !!checked
                      }
                    })
                  }
                />
                <Label htmlFor="creditCard">Cartão de Crédito</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleNext}
          disabled={!formData.amount || !formData.due_date || !formData.description}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
