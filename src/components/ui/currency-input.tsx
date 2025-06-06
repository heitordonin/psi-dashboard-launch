
import * as React from "react";
import CurrencyInputField from 'react-currency-input-field';
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
    const handleValueChange = (value: string | undefined, name?: string, values?: any) => {
      if (onChange) {
        // Use the float value directly from react-currency-input-field
        const numericValue = values?.float || 0;
        onChange(numericValue);
      }
    };

    return (
      <CurrencyInputField
        {...props}
        ref={ref}
        name={name}
        value={value}
        onValueChange={handleValueChange}
        placeholder={placeholder}
        intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
        decimalScale={2}
        fixedDecimalLength={2}
        decimalSeparator=","
        groupSeparator="."
        prefix="R$ "
        allowDecimals={true}
        allowNegativeValue={false}
        disabled={disabled}
        disableGroupSeparators={false}
        step={1}
        transformRawValue={(rawValue) => {
          // Remove all non-numeric characters except decimal separator
          const cleanValue = rawValue.replace(/[^\d]/g, '');
          
          // If empty, return empty
          if (!cleanValue) return '';
          
          // Add decimal point automatically (last 2 digits are decimal)
          if (cleanValue.length === 1) {
            return '0.0' + cleanValue;
          } else if (cleanValue.length === 2) {
            return '0.' + cleanValue;
          } else {
            const integerPart = cleanValue.slice(0, -2);
            const decimalPart = cleanValue.slice(-2);
            return integerPart + '.' + decimalPart;
          }
        }}
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
