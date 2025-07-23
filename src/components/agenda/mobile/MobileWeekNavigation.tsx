import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface MobileWeekNavigationProps {
  currentWeek: Date;
  onWeekChange: (week: Date) => void;
  onCalendarOpen: () => void;
}

export const MobileWeekNavigation = ({ 
  currentWeek, 
  onWeekChange, 
  onCalendarOpen 
}: MobileWeekNavigationProps) => {
  const { elementRef } = useSwipeGesture({
    onSwipeLeft: () => onWeekChange(addWeeks(currentWeek, 1)),
    onSwipeRight: () => onWeekChange(subWeeks(currentWeek, 1)),
    threshold: 100
  });

  return (
    <div 
      ref={elementRef}
      className="flex items-center justify-between p-4 bg-card border-b touch-target"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onWeekChange(subWeeks(currentWeek, 1))}
        className="touch-target h-10 w-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        onClick={onCalendarOpen}
        className="flex items-center gap-2 text-lg font-medium touch-target"
      >
        <Calendar className="h-5 w-5" />
        {format(currentWeek, "MMMM yyyy", { locale: ptBR })}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onWeekChange(addWeeks(currentWeek, 1))}
        className="touch-target h-10 w-10"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};