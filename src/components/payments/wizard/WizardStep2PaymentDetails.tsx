
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DefaultDescriptionModal } from '@/components/DefaultDescriptionModal';
import { InvoiceDescriptionsManager } from '@/components/InvoiceDescriptionsManager';
import { Button } from '@/components/ui/button';
import { FileText, CreditCard, QrCode } from 'lucide-react';
import { useState } from 'react';
import type { WizardFormData } from '../CreatePaymentWizard';

interface WizardStep2PaymentDetailsProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
}

export function WizardStep2PaymentDetails({ formData, updateFormData, onNext }: WizardStep2PaymentDetailsProps) {
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showDescriptionManager, setShowDescriptionManager] = useState(false);

  const handleSelectDescription = (description: string) => {
    updateFormData({ description });
    setShowDescriptionModal(false);
  };

  const handleManageDescriptions = () => {
    setShowDescriptionModal(false);
    setShowDescriptionManager(true);
  };

  const handlePaymentMethodChange = (method: 'boleto' | 'creditCard', checked: boolean) => {
    updateFormData({
      paymentMethods: {
        ...formData.paymentMethods,
        [method]: checked
      }
    });
  };

  const isValid = () => {
    return formData.amount > 0 && formData.due_date && formData.description.trim();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            Detalhes do Pagamento
          </h2>
          <p className="text-gray-600">
            Configure os dados básicos da cobrança
          </p>
        </div>

        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Formas de Pagamento</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="boleto"
                  checked={formData.paymentMethods.boleto}
                  onCheckedChange={(checked) => handlePaymentMethodChange('boleto', checked === true)}
                />
                <QrCode className="w-5 h-5 text-green-600" />
                <Label htmlFor="boleto" className="cursor-pointer">
                  Boleto Bancário / PIX
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="creditCard"
                  checked={formData.paymentMethods.creditCard}
                  onCheckedChange={(checked) => handlePaymentMethodChange('creditCard', checked === true)}
                />
                <CreditCard className="w-5 h-5 text-blue-600" />
                <Label htmlFor="creditCard" className="cursor-pointer">
                  Cartão de Crédito
                </Label>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-medium">
              Valor *
            </Label>
            <CurrencyInput
              value={formData.amount}
              onChange={(value) => updateFormData({ amount: value })}
              placeholder="R$ 0,00"
              className="w-full"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-base font-medium">
              Data de Vencimento *
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => updateFormData({ due_date: e.target.value })}
              className="w-full"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-base font-medium">
                Descrição *
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDescriptionModal(true)}
                className="text-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Usar Descrição Padrão
              </Button>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Descrição da cobrança..."
              className="w-full"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={onNext}
            disabled={!isValid()}
            className="px-8"
          >
            Continuar
          </Button>
        </div>
      </div>

      <DefaultDescriptionModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        onSelectDescription={handleSelectDescription}
        onManageDescriptions={handleManageDescriptions}
      />

      <InvoiceDescriptionsManager
        isOpen={showDescriptionManager}
        onClose={() => setShowDescriptionManager(false)}
      />
    </>
  );
}
