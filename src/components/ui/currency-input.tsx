
import * as React from "react";
import CurrencyInputField from 'react-currency-input-field';
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value?: string | number;
  onChange?: (value: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, placeholder = "0,00", disabled = false, ...props }, ref) => {
    const handleValueChange = (value: string | undefined) => {
      if (onChange) {
        const numericValue = value ? parseFloat(value) : 0;
        onChange(numericValue);
      }
    };

    return (
      <CurrencyInputField
        {...props}
        ref={ref}
        value={value}
        onValueChange={handleValueChange}
        placeholder={placeholder}
        intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
        decimalsLimit={2}
        prefix="R$ "
        allowDecimals={true}
        allowNegativeValue={false}
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
