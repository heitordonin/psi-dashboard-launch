import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ptBR } from "date-fns/locale";

interface MobileCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const MobileCalendarModal = ({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect
}: MobileCalendarModalProps) => {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Selecionar Data</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md border"
            locale={ptBR}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};