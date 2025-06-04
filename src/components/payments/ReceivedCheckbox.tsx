
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface ReceivedCheckboxProps {
  isAlreadyReceived: boolean;
  setIsAlreadyReceived: (value: boolean) => void;
  receivedDate: string;
  setReceivedDate: (value: string) => void;
  errors: Record<string, string>;
  isEditing?: boolean;
}

export const ReceivedCheckbox = ({
  isAlreadyReceived,
  setIsAlreadyReceived,
  receivedDate,
  setReceivedDate,
  errors,
  isEditing = false
}: ReceivedCheckboxProps) => {
  useEffect(() => {
    if (isAlreadyReceived && !receivedDate) {
      const today = new Date().toISOString().split('T')[0];
      setReceivedDate(today);
    }
  }, [isAlreadyReceived, receivedDate, setReceivedDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="already-received"
          checked={isAlreadyReceived}
          onCheckedChange={(checked) => setIsAlreadyReceived(checked === true)}
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
            className={errors.receivedDate ? 'border-red-500' : ''}
          />
          {errors.receivedDate && <p className="text-red-500 text-sm mt-1">{errors.receivedDate}</p>}
        </div>
      )}
    </div>
  );
};
