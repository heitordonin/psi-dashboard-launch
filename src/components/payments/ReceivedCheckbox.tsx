
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { validatePaymentDateReceitaSaude, validatePaymentUnmarkRetroactive } from "@/utils/receitaSaudeValidation";
import { useSubscription } from "@/hooks/useSubscription";
import { UnmarkPaymentDialog } from "./UnmarkPaymentDialog";

interface ReceivedCheckboxProps {
  isAlreadyReceived: boolean;
  setIsAlreadyReceived: (value: boolean) => void;
  receivedDate: string;
  setReceivedDate: (value: string) => void;
  errors: Record<string, string>;
  isEditing?: boolean;
  originalPaidDate?: string;
}

export const ReceivedCheckbox = ({
  isAlreadyReceived,
  setIsAlreadyReceived,
  receivedDate,
  setReceivedDate,
  errors,
  isEditing = false,
  originalPaidDate
}: ReceivedCheckboxProps) => {
  const [receitaSaudeError, setReceitaSaudeError] = useState<string | null>(null);
  const [showUnmarkDialog, setShowUnmarkDialog] = useState(false);
  const { currentPlan } = useSubscription();

  useEffect(() => {
    if (isAlreadyReceived && !receivedDate) {
      const today = new Date().toISOString().split('T')[0];
      setReceivedDate(today);
    }
  }, [isAlreadyReceived, receivedDate, setReceivedDate]);

  // Validar data de recebimento quando mudar (apenas para Psi Regular)
  useEffect(() => {
    if (receivedDate && currentPlan?.slug === 'psi_regular') {
      const validation = validatePaymentDateReceitaSaude(receivedDate);
      setReceitaSaudeError(validation.isValid ? null : validation.errorMessage || null);
    } else {
      setReceitaSaudeError(null);
    }
  }, [receivedDate, currentPlan?.slug]);

  // Função para lidar com mudança do checkbox
  const handleCheckboxChange = (checked: boolean) => {
    console.log('🔄 Tentativa de mudança checkbox:', { 
      checked, 
      isAlreadyReceived, 
      isEditing, 
      originalPaidDate,
      planSlug: currentPlan?.slug 
    });
    
    // Se está tentando desmarcar um pagamento já registrado
    if (!checked && isAlreadyReceived && isEditing && originalPaidDate) {
      console.log('🔍 Verificando desmarcação de pagamento registrado...');
      
      const validation = validatePaymentUnmarkRetroactive(originalPaidDate, currentPlan);
      
      if (!validation.isValid) {
        console.log('❌ Desmarcação bloqueada:', validation.errorMessage);
        setShowUnmarkDialog(true);
        return; // Impedir a desmarcação
      }
    }
    
    console.log('✅ Mudança do checkbox permitida');
    setIsAlreadyReceived(checked);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="already-received"
          checked={isAlreadyReceived}
          onCheckedChange={(checked) => handleCheckboxChange(checked === true)}
        />
        <Label htmlFor="already-received">
          {isEditing ? "Pagamento foi recebido?" : "Valor já recebido?"}
        </Label>
      </div>

      {isAlreadyReceived && (
        <div>
          <Label htmlFor="received_date">Data do Recebimento *</Label>
          <Input
            id="received_date"
            type="date"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={errors.receivedDate || receitaSaudeError ? 'border-red-500' : ''}
          />
          {errors.receivedDate && <p className="text-red-500 text-sm mt-1">{errors.receivedDate}</p>}
          {receitaSaudeError && <p className="text-red-500 text-sm mt-1">{receitaSaudeError}</p>}
        </div>
      )}

      <UnmarkPaymentDialog
        isOpen={showUnmarkDialog}
        onClose={() => setShowUnmarkDialog(false)}
        paidDate={originalPaidDate || ""}
      />
    </div>
  );
};
