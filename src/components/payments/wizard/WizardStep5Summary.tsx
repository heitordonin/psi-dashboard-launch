
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PaymentSummaryDisplay } from './PaymentSummaryDisplay';
import { PayerSummaryDisplay } from './PayerSummaryDisplay';
import { usePaymentMutation } from './usePaymentMutation';
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
  isEditMode?: boolean;
  paymentToEdit?: Payment | null;
}

export function WizardStep5Summary({
  formData,
  patients,
  onSuccess,
  onClose,
  onPrevious,
  updateFormData,
  isEditMode = false,
  paymentToEdit = null
}: WizardStep5Props) {
  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  const createPaymentMutation = usePaymentMutation({
    formData,
    selectedPatient,
    isEditMode,
    paymentToEdit,
    onSuccess,
    onClose
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Resumo e Confirmação</h3>
        
        <div className="space-y-4">
          <PaymentSummaryDisplay formData={formData} />
          <PayerSummaryDisplay formData={formData} selectedPatient={selectedPatient} />

          {/* Checkbox "Marcar como já recebido" apenas para charges manuais */}
          {formData.chargeType === 'manual' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isReceived"
                checked={formData.isReceived}
                onCheckedChange={(checked) => updateFormData({ isReceived: !!checked })}
              />
              <Label htmlFor="isReceived">Marcar como já recebido</Label>
            </div>
          )}

          {/* Botão de ação */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={createPaymentMutation.isPending}
            >
              Voltar
            </Button>
            <Button
              onClick={() => createPaymentMutation.mutate()}
              disabled={createPaymentMutation.isPending}
              className="flex-1"
            >
              {createPaymentMutation.isPending 
                ? (isEditMode ? 'Salvando...' : 'Criando...') 
                : (isEditMode ? 'Salvar Alterações' : 'Concluir')
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
