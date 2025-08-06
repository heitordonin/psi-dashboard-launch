import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/types/appointment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle, XCircle, Calendar, Clock } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface CompactAppointmentItemProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onUpdateStatus: (appointmentId: string, status: 'scheduled' | 'completed' | 'no_show' | 'cancelled') => void;
}

const statusConfig = {
  scheduled: {
    label: "Agendado",
    className: "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
  },
  completed: {
    label: "Realizado", 
    className: "bg-green-50 text-green-700 border-l-4 border-green-500"
  },
  no_show: {
    label: "Faltou",
    className: "bg-orange-50 text-orange-700 border-l-4 border-orange-500"
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-50 text-red-700 border-l-4 border-red-500"
  }
};

export const CompactAppointmentItem = ({ 
  appointment, 
  onEdit,
  onUpdateStatus 
}: CompactAppointmentItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();
  
  const startTime = format(new Date(appointment.start_datetime), "HH:mm", { locale: ptBR });
  const endTime = format(new Date(appointment.end_datetime), "HH:mm", { locale: ptBR });
  const config = statusConfig[appointment.status];

  const handleStatusChange = (status: 'scheduled' | 'completed' | 'no_show' | 'cancelled') => {
    triggerHaptic('light');
    onUpdateStatus(appointment.id, status);
    setIsMenuOpen(false);
  };

  const handleSwipeRight = () => {
    if (appointment.status !== 'completed') {
      triggerHaptic('success');
      onUpdateStatus(appointment.id, 'completed');
    }
  };

  const handleSwipeLeft = () => {
    triggerHaptic('light');
    setIsMenuOpen(true);
  };

  const { elementRef } = useSwipeGesture({
    onSwipeRight: handleSwipeRight,
    onSwipeLeft: handleSwipeLeft,
    threshold: 50
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent edit when clicking on menu button
    if ((e.target as HTMLElement).closest('[data-menu-trigger]')) {
      return;
    }
    onEdit(appointment);
  };

  return (
    <div 
      ref={elementRef}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${config.className} relative`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">{config.label}</span>
            <span className="text-sm font-mono">{startTime}-{endTime}</span>
          </div>
          {appointment.patient_name && (
            <p className="text-sm truncate">{appointment.patient_name}</p>
          )}
        </div>
        
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger 
            asChild
            data-menu-trigger
            className="ml-2 p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
              }}
              className="flex items-center justify-center w-6 h-6"
            >
              <MoreVertical size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => handleStatusChange('completed')}
              className="flex items-center gap-2"
            >
              <CheckCircle size={16} className="text-green-600" />
              Marcar como Realizado
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange('no_show')}
              className="flex items-center gap-2"
            >
              <XCircle size={16} className="text-orange-600" />
              Marcar como Faltou
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange('cancelled')}
              className="flex items-center gap-2"
            >
              <XCircle size={16} className="text-red-600" />
              Cancelar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange('scheduled')}
              className="flex items-center gap-2"
            >
              <Calendar size={16} className="text-blue-600" />
              Marcar como Agendado
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setIsMenuOpen(false);
                onEdit(appointment);
              }}
              className="flex items-center gap-2"
            >
              <Clock size={16} className="text-gray-600" />
              Editar Agendamento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Swipe hint indicator */}
      {isMobile && (
        <div className="absolute bottom-1 right-1 text-xs text-gray-400 opacity-60">
          ← →
        </div>
      )}
    </div>
  );
};