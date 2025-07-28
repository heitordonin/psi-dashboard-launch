import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/types/appointment";
import { cn } from "@/lib/utils";

interface MobileCompactCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  appointments: Appointment[];
}

export const MobileCompactCalendar = ({ 
  selectedDate, 
  onDateSelect, 
  appointments 
}: MobileCompactCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const hasAppointments = (date: Date) => {
    return appointments.some(apt => {
      const aptDate = new Date(apt.start_datetime);
      return isSameDay(aptDate, date);
    });
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    setCurrentMonth(date);
  };

  return (
    <div className="mobile-spacing">
      <Card className="mobile-card">
        <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePreviousMonth}
            className="touch-target h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-sm font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h3>
          
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="touch-target h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-muted-foreground p-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="mobile-calendar-grid grid-cols-7">
          {calendarDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const hasAppts = hasAppointments(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "relative h-8 w-8 text-xs rounded-md transition-colors touch-target",
                  "hover:bg-accent hover:text-accent-foreground active:scale-95",
                  isSelected && "bg-primary text-primary-foreground",
                  !isCurrentMonth && "text-muted-foreground opacity-50",
                  !isSelected && isCurrentMonth && "text-foreground"
                )}
              >
                {format(day, "d")}
                {hasAppts && (
                  <div className={cn(
                    "absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  )} />
                )}
              </button>
            );
          })}
        </div>
        </CardContent>
      </Card>
    </div>
  );
};