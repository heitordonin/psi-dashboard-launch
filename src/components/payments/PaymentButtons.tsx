
import { Button } from "@/components/ui/button";

interface PaymentButtonsProps {
  onClose: () => void;
  isLoading: boolean;
  isEditing: boolean;
}

export const PaymentButtons = ({ onClose, isLoading, isEditing }: PaymentButtonsProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isEditing ? 'Atualizar' : 'Criar'} Cobrança
      </Button>
    </div>
  );
};
