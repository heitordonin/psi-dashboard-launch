
import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value?: string | number;
  onChange?: (value: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, placeholder = "R$ 0,00", disabled = false, name, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Initialize display value from prop value
    React.useEffect(() => {
      if (typeof value === 'number' && value > 0) {
        const formatted = value.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });
        setDisplayValue(formatted);
      } else if (!value) {
        setDisplayValue('');
      }
    }, [value]);

    const formatCurrency = (input: string) => {
      // Remove todos os caracteres que não são dígitos
      const numericValue = input.replace(/\D/g, '');

      // Se não há dígitos, retorna string vazia
      if (!numericValue) return '';

      // Converte para número e divide por 100 para obter os centavos
      const number = parseFloat(numericValue) / 100;

      // Formata o número para o formato brasileiro
      return number.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const formatted = formatCurrency(input);
      setDisplayValue(formatted);

      // Extract numeric value and call onChange
      if (onChange) {
        const numericValue = input.replace(/\D/g, '');
        const number = numericValue ? parseFloat(numericValue) / 100 : 0;
        onChange(number);
      }
    };

    return (
      <input
        {...props}
        ref={ref}
        name={name}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
