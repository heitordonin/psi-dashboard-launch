
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PaymentSummaryDetails } from './PaymentSummaryDetails';
import { PayerSummaryDetails } from './PayerSummaryDetails';
import { ReceivedDatePicker } from './ReceivedDatePicker';
import { usePaymentCreation } from '@/hooks/usePaymentCreation';
import { usePaymentDateHandler } from '@/hooks/usePaymentDateHandler';
import { RetroactiveDateConfirmationDialog } from '../RetroactiveDateConfirmationDialog';
import type { WizardFormData } from './types';
import type { Patient } from '@/types/patient';
import type { Payment } from '@/types/payment';

interface WizardStep5Props {
  formData: WizardFormData;
  patients: Patient[];
  onSuccess?: () => void;
  onClose: () => void;
  onPrevious: () => void;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  paymentToEdit?: Payment | null;
}

export function WizardStep5Summary({
  formData,
  patients,
  onSuccess,
  onClose,
  onPrevious,
  updateFormData,
  paymentToEdit
}: WizardStep5Props) {
  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  const { handleSubmit: originalHandleSubmit, isLoading, isEditMode } = usePaymentCreation({
    formData,
    selectedPatient,
    onSuccess,
    onClose,
    paymentToEdit
  });

  const {
    showRetroactiveDialog,
    pendingDate,
    hasRetroactiveWarning,
    handleDateChange,
    handleRetroactiveConfirm,
    handleRetroactiveCancel
  } = usePaymentDateHandler({
    onDateChange: (date) => updateFormData({ receivedDate: date }),
    onSubmitWithRetroactiveDate: originalHandleSubmit
  });

  const handleSubmit = () => {
    console.log('✅ WizardStep5 - Submetendo formulário');
    originalHandleSubmit();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Resumo e Confirmação</h3>
        
        <div className="space-y-4">
          <PaymentSummaryDetails formData={formData} />
          <PayerSummaryDetails formData={formData} selectedPatient={selectedPatient} />

          {/* Checkbox "Marcar como já recebido" apenas para charges manuais */}
          {formData.chargeType === 'manual' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isReceived"
                  checked={formData.isReceived}
                  onCheckedChange={(checked) => updateFormData({ isReceived: !!checked })}
                />
                <Label htmlFor="isReceived">Marcar como já recebido</Label>
              </div>

              {/* Campo de data do pagamento quando marcado como recebido */}
              {formData.isReceived && (
                <ReceivedDatePicker
                  receivedDate={formData.receivedDate || ''}
                  hasRetroactiveWarning={hasRetroactiveWarning}
                  onDateChange={handleDateChange}
                />
              )}
            </div>
          )}

          {/* Botão de ação */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isLoading}
            >
              Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (isEditMode ? 'Salvando...' : 'Criando...') : (isEditMode ? 'Salvar Alterações' : 'Concluir')}
            </Button>
          </div>
        </div>
      </div>

      <RetroactiveDateConfirmationDialog
        isOpen={showRetroactiveDialog}
        onClose={handleRetroactiveCancel}
        onConfirm={handleRetroactiveConfirm}
        selectedDate={pendingDate}
      />
    </div>
  );
}
