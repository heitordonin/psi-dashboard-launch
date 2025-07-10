import React, { useState } from 'react';
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ReceivedDatePickerProps {
  receivedDate: string;
  hasRetroactiveWarning: boolean;
  onDateChange: (date: Date | undefined) => void;
}

export function ReceivedDatePicker({ 
  receivedDate, 
  hasRetroactiveWarning, 
  onDateChange 
}: ReceivedDatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    onDateChange(date);
    setIsCalendarOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="receivedDate">Data do Pagamento *</Label>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !receivedDate && "text-muted-foreground",
              hasRetroactiveWarning && "border-orange-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {receivedDate ? format(new Date(receivedDate + 'T00:00:00'), "dd/MM/yyyy") : "Selecionar data do pagamento"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={receivedDate ? new Date(receivedDate + 'T00:00:00') : undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date > new Date()}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      
      {hasRetroactiveWarning && (
        <p className="text-sm text-orange-600 mt-2">
          ⚠️ Data retroativa detectada - aguardando confirmação
        </p>
      )}
    </div>
  );
}