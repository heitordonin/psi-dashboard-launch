
import React, { useState, useEffect } from 'react';
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
  const [receitaSaudeError, setReceitaSaudeError] = useState<string | null>(null);
  const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
  const [retroactiveDateConfirmed, setRetroactiveDateConfirmed] = useState(false);
  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  
  // Validação em tempo real da data de recebimento
  useEffect(() => {
    if (formData.isReceived && formData.receivedDate) {
      console.log('🔄 WizardStep5 - Validando data de recebimento:', {
        isReceived: formData.isReceived,
        receivedDate: formData.receivedDate
      });
      
      const validation = validatePaymentDateReceitaSaude(formData.receivedDate);
      
      if (!validation.isValid) {
        console.log('❌ WizardStep5 - Erro de validação:', validation.errorMessage);
        setReceitaSaudeError(validation.errorMessage || 'Data inválida');
        setRetroactiveDateConfirmed(false);
      } else {
        console.log('✅ WizardStep5 - Validação OK');
        setReceitaSaudeError(null);
        setRetroactiveDateConfirmed(false);
      }
    } else {
      setReceitaSaudeError(null);
      setRetroactiveDateConfirmed(false);
    }
  }, [formData.isReceived, formData.receivedDate]);

  const { handleSubmit: originalHandleSubmit, isLoading, isEditMode } = usePaymentCreation({
    formData,
    selectedPatient,
    onSuccess,
    onClose,
    paymentToEdit
  });

  const handleSubmit = () => {
    console.log('🎯 WizardStep5 - Tentativa de submissão:', {
      receitaSaudeError,
      retroactiveDateConfirmed,
      isReceived: formData.isReceived,
      receivedDate: formData.receivedDate
    });
    
    // Se há erro de Receita Saúde e não foi confirmado, mostrar modal
    if (receitaSaudeError && !retroactiveDateConfirmed) {
      console.log('🚨 WizardStep5 - Abrindo modal de confirmação retroativa');
      setShowRetroactiveDialog(true);
      return;
    }
    
    console.log('✅ WizardStep5 - Submetendo formulário');
    originalHandleSubmit();
  };

  const handleRetroactiveConfirm = () => {
    setRetroactiveDateConfirmed(true);
    setShowRetroactiveDialog(false);
    originalHandleSubmit();
  };

  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = formatDateForDatabase(date);
      updateFormData({ receivedDate: formattedDate });
      setIsCalendarOpen(false);
    }
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
                          receitaSaudeError && !retroactiveDateConfirmed && "border-destructive"
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
                        onSelect={handleDateSelect}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {receitaSaudeError && !retroactiveDateConfirmed && (
                    <p className="text-sm text-destructive mt-2">
                      ⚠️ Data retroativa detectada. Clique em "Concluir" para prosseguir com a operação.
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
        onClose={() => setShowRetroactiveDialog(false)}
        onConfirm={handleRetroactiveConfirm}
        selectedDate={formData.receivedDate || ''}
      />
    </div>
  );
}
