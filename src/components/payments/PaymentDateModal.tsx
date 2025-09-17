
import { useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSafeDateFromString, formatDateForInput } from "@/utils/dateUtils";
import { validatePaymentDateReceitaSaude } from "@/utils/receitaSaudeValidation";
import { RetroactiveDateConfirmationDialog } from "./RetroactiveDateConfirmationDialog";
import { useSubscription } from "@/hooks/useSubscription";

interface PaymentDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  isLoading?: boolean;
}

export function PaymentDateModal({ isOpen, onClose, onConfirm, isLoading = false }: PaymentDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [hasRetroactiveWarning, setHasRetroactiveWarning] = useState(false);
  
  const { currentPlan } = useSubscription();

  const handleDateChange = (date: Date) => {
    if (!date) {
      setSelectedDate(new Date());
      setHasRetroactiveWarning(false);
      return;
    }

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const formattedDate = format(normalizedDate, 'yyyy-MM-dd');
    
    console.log('🔄 PaymentDateModal - Validando data:', {
      selectedDate: date.toISOString(),
      formattedDate,
      userPlan: currentPlan?.slug
    });
    
    // Aplicar validação de Receita Saúde apenas para usuários do plano psi_regular
    const shouldApplyValidation = currentPlan?.slug === 'psi_regular';
    const validation = shouldApplyValidation 
      ? validatePaymentDateReceitaSaude(formattedDate)
      : { isValid: true };
    
    if (!validation.isValid && shouldApplyValidation) {
      console.log('❌ PaymentDateModal - Data retroativa detectada para usuário Psi Regular');
      setPendingDate(date);
      setShowRetroactiveDialog(true);
      setHasRetroactiveWarning(true);
    } else {
      console.log('✅ PaymentDateModal - Data válida ou usuário não-Psi Regular');
      setSelectedDate(date);
      setHasRetroactiveWarning(false);
    }
  };

  const handleConfirm = () => {
    if (selectedDate) {
      console.log('✅ PaymentDateModal - Confirmando data');
      onConfirm(selectedDate);
    }
  };

  const handleRetroactiveConfirm = () => {
    if (pendingDate) {
      setSelectedDate(pendingDate);
      setShowRetroactiveDialog(false);
      setHasRetroactiveWarning(false);
      setPendingDate(null);
      onConfirm(pendingDate);
    }
  };

  const handleRetroactiveCancel = () => {
    setShowRetroactiveDialog(false);
    setHasRetroactiveWarning(false);
    setPendingDate(null);
  };

  const isFutureDate = selectedDate > new Date();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Data do Pagamento</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione a data em que o pagamento foi realmente recebido:
              </p>
              
              <div className="space-y-2">
                <input
                  type="date"
                  value={formatDateForInput(selectedDate)}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      const newDate = createSafeDateFromString(dateValue);
                      handleDateChange(newDate);
                    }
                  }}
                  max={formatDateForInput(new Date())}
                  className={cn(
                    "w-full px-3 py-2 border border-input bg-background text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                    hasRetroactiveWarning && "border-orange-500",
                    isFutureDate && "border-destructive"
                  )}
                />
                
                {isFutureDate && (
                  <p className="text-sm text-destructive">
                    A data do pagamento não pode ser no futuro.
                  </p>
                )}
                
                {hasRetroactiveWarning && (
                  <p className="text-sm text-orange-600">
                    ⚠️ Data retroativa detectada - aguardando confirmação
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Processando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <RetroactiveDateConfirmationDialog
        isOpen={showRetroactiveDialog}
        onClose={handleRetroactiveCancel}
        onConfirm={handleRetroactiveConfirm}
        selectedDate={pendingDate ? format(pendingDate, 'yyyy-MM-dd') : ''}
      />
    </>
  );
}
