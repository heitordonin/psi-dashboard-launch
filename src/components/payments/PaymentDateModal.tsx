import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { validatePaymentDateReceitaSaude } from "@/utils/receitaSaudeValidation";
import { RetroactiveDateConfirmationDialog } from "./RetroactiveDateConfirmationDialog";

interface PaymentDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  isLoading?: boolean;
}

export function PaymentDateModal({ isOpen, onClose, onConfirm, isLoading = false }: PaymentDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [receitaSaudeError, setReceitaSaudeError] = useState<string | null>(null);
  const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
  const [retroactiveDateConfirmed, setRetroactiveDateConfirmed] = useState(false);

  // Validação em tempo real da data selecionada
  useEffect(() => {
    if (selectedDate) {
      // Normalizar a data selecionada
      const normalizedDate = new Date(selectedDate);
      normalizedDate.setHours(0, 0, 0, 0);
      const formattedDate = format(normalizedDate, 'yyyy-MM-dd');
      
      console.log('🔄 PaymentDateModal - Validando data:', {
        selectedDate: selectedDate.toISOString(),
        formattedDate
      });
      
      const validation = validatePaymentDateReceitaSaude(formattedDate);
      
      if (!validation.isValid) {
        console.log('❌ PaymentDateModal - Erro de validação:', validation.errorMessage);
        setReceitaSaudeError(validation.errorMessage || 'Data inválida');
        setRetroactiveDateConfirmed(false);
      } else {
        console.log('✅ PaymentDateModal - Validação OK');
        setReceitaSaudeError(null);
        // Reset confirmation when date changes
        setRetroactiveDateConfirmed(false);
      }
    }
  }, [selectedDate]);

  const handleConfirm = () => {
    if (selectedDate) {
      console.log('🎯 PaymentDateModal - Tentativa de confirmação:', {
        selectedDate: selectedDate.toISOString(),
        receitaSaudeError,
        retroactiveDateConfirmed
      });
      
      // Se há erro de Receita Saúde e não foi confirmado, mostrar modal
      if (receitaSaudeError && !retroactiveDateConfirmed) {
        console.log('🚨 PaymentDateModal - Abrindo modal de confirmação retroativa');
        setShowRetroactiveDialog(true);
        return;
      }
      
      console.log('✅ PaymentDateModal - Confirmando data');
      onConfirm(selectedDate);
    }
  };

  const handleRetroactiveConfirm = () => {
    setRetroactiveDateConfirmed(true);
    setShowRetroactiveDialog(false);
    onConfirm(selectedDate);
  };

  const isFutureDate = selectedDate > new Date();
  const hasReceitaSaudeError = receitaSaudeError && !retroactiveDateConfirmed;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Data do Pagamento</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Selecione a data em que o pagamento foi realmente recebido:
          </p>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                  hasReceitaSaudeError && "border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
                disabled={(date) => date > new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          {isFutureDate && (
            <p className="text-sm text-destructive mt-2">
              A data do pagamento não pode ser no futuro.
            </p>
          )}
          
          {hasReceitaSaudeError && (
            <p className="text-sm text-destructive mt-2">
              ⚠️ Data retroativa detectada. Clique em "Confirmar" para prosseguir com a operação.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isFutureDate || isLoading}
          >
            {isLoading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <RetroactiveDateConfirmationDialog
        isOpen={showRetroactiveDialog}
        onClose={() => setShowRetroactiveDialog(false)}
        onConfirm={handleRetroactiveConfirm}
        selectedDate={format(selectedDate, 'yyyy-MM-dd')}
      />
    </Dialog>
  );
}