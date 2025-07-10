
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateDueDateReceitaSaude } from '@/utils/receitaSaudeValidation';

interface PaymentDueDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  isReceived: boolean;
}

export function PaymentDueDateField({ value, onChange, isReceived }: PaymentDueDateFieldProps) {
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (value && !isReceived) {
      console.log('Validating due date:', value);
      const validation = validateDueDateReceitaSaude(value);
      console.log('Validation result:', validation);
      if (!validation.isValid) {
        setError(validation.errorMessage || '');
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }, [value, isReceived]);

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
        className={`w-full ${error ? 'border-red-500' : ''}`}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
