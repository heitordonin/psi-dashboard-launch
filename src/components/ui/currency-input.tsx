
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'value' | 'onChange'> {
  value?: string | number;
  onChange?: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const { value: displayValue, handleChange, getNumericValue } = useCurrencyInput(value);

    React.useEffect(() => {
      if (typeof value === 'number' && value !== getNumericValue()) {
        handleChange(value.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }));
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
      if (onChange) {
        const numericValue = getNumericValue();
        onChange(numericValue);
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          {...props}
          ref={ref}
          value={displayValue}
          onChange={handleInputChange}
          className={cn("pl-10", className)}
          placeholder="0,00"
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
