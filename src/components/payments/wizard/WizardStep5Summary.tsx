
import React, { useState } from 'react';
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PaymentSummaryDetails } from './PaymentSummaryDetails';
import { PayerSummaryDetails } from './PayerSummaryDetails';
import { usePaymentCreation } from '@/hooks/usePaymentCreation';
import { validatePaymentDateReceitaSaude } from '@/utils/receitaSaudeValidation';
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState<string>('');
  const [hasRetroactiveWarning, setHasRetroactiveWarning] = useState(false);
  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  const { handleSubmit: originalHandleSubmit, isLoading, isEditMode } = usePaymentCreation({
    formData,
    selectedPatient,
    onSuccess,
    onClose,
    paymentToEdit
  });

  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      updateFormData({ receivedDate: '' });
      setHasRetroactiveWarning(false);
      setIsCalendarOpen(false);
      return;
    }

    const formattedDate = formatDateForDatabase(date);
    
    console.log('🔄 WizardStep5 - Validando data de recebimento:', {
      formattedDate
    });
    
    const validation = validatePaymentDateReceitaSaude(formattedDate);
    
    if (!validation.isValid) {
      console.log('❌ WizardStep5 - Data retroativa detectada');
      setPendingDate(formattedDate);
      setShowRetroactiveDialog(true);
      setHasRetroactiveWarning(true);
    } else {
      console.log('✅ WizardStep5 - Data válida');
      updateFormData({ receivedDate: formattedDate });
      setHasRetroactiveWarning(false);
    }
    setIsCalendarOpen(false);
  };

  const handleSubmit = () => {
    console.log('✅ WizardStep5 - Submetendo formulário');
    originalHandleSubmit();
  };

  const handleRetroactiveConfirm = () => {
    updateFormData({ receivedDate: pendingDate });
    setShowRetroactiveDialog(false);
    setHasRetroactiveWarning(false);
    setPendingDate('');
    originalHandleSubmit();
  };

  const handleRetroactiveCancel = () => {
    setShowRetroactiveDialog(false);
    setHasRetroactiveWarning(false);
    setPendingDate('');
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
                <div className="space-y-2">
                  <Label htmlFor="receivedDate">Data do Pagamento *</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.receivedDate && "text-muted-foreground",
                          hasRetroactiveWarning && "border-orange-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.receivedDate ? format(new Date(formData.receivedDate + 'T00:00:00'), "dd/MM/yyyy") : "Selecionar data do pagamento"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.receivedDate ? new Date(formData.receivedDate + 'T00:00:00') : undefined}
                        onSelect={handleDateChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {hasRetroactiveWarning && (
                    <p className="text-sm text-orange-600 mt-2">
                      ⚠️ Data retroativa detectada - aguardando confirmação
                    </p>
                  )}
                </div>
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
