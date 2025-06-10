
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentDueDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  isReceived: boolean;
}

export function PaymentDueDateField({ value, onChange, isReceived }: PaymentDueDateFieldProps) {
  if (isReceived) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="due_date">Data de Vencimento *</Label>
      <Input
        id="due_date"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
