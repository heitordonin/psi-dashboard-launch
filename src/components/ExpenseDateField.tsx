import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useExpenseDateHandler } from "@/hooks/useExpenseDateHandler";
import { RetroactiveExpenseDateDialog } from "./RetroactiveExpenseDateDialog";

interface ExpenseDateFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const ExpenseDateField: React.FC<ExpenseDateFieldProps> = ({
  value,
  onValueChange,
  label = "Data do Pagamento",
  placeholder = "Selecione a data",
  required = false
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const {
    showRetroactiveDialog,
    pendingDate,
    hasRetroactiveWarning,
    handleDateChange,
    handleRetroactiveConfirm,
    handleRetroactiveCancel
  } = useExpenseDateHandler({
    onDateChange: onValueChange,
    onPopoverClose: () => setIsPopoverOpen(false)
  });

  // Create date object with proper local timezone handling
  const dateValue = value ? (() => {
    console.log('📅 ExpenseDateField - Criando Date object a partir do valor:', value);
    const [year, month, day] = value.split('-').map(Number);
    const createdDate = new Date(year, month - 1, day);
    console.log('📅 ExpenseDateField - Date object criado:', {
      value,
      year, month, day,
      createdDate: createdDate.toISOString(),
      dateString: createdDate.toDateString()
    });
    return createdDate;
  })() : undefined;

  return (
    <>
      <FormItem className="flex flex-col">
        <FormLabel className={required ? "required" : ""}>
          {label}
        </FormLabel>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant="outline"
                className={cn(
                  "pl-3 text-left font-normal",
                  !value && "text-muted-foreground",
                  hasRetroactiveWarning && "border-amber-500 bg-amber-50"
                )}
              >
                {value ? (
                  (() => {
                    const [year, month, day] = value.split('-').map(Number);
                    const displayDate = new Date(year, month - 1, day);
                    const formatted = format(displayDate, "dd/MM/yyyy");
                    console.log('📅 ExpenseDateField - Exibindo data:', { value, displayDate, formatted });
                    return formatted;
                  })()
                ) : (
                  <span>{placeholder}</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateChange}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>

      <RetroactiveExpenseDateDialog
        isOpen={showRetroactiveDialog}
        onClose={handleRetroactiveCancel}
        onConfirm={handleRetroactiveConfirm}
        selectedDate={pendingDate}
      />
    </>
  );
};