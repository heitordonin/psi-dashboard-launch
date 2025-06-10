
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';

interface PaymentAmountFieldProps {
  value: number;
  onChange: (value: number) => void;
}

export function PaymentAmountField({ value, onChange }: PaymentAmountFieldProps) {
  const handleChange = (value: number) => {
    console.log('Currency input changed:', value);
    onChange(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="amount">Valor *</Label>
      <CurrencyInput
        value={value}
        onChange={handleChange}
        placeholder="R$ 0,00"
        className="w-full"
      />
    </div>
  );
}
