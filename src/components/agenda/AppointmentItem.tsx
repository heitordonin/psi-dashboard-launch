import { useState } from "react";
import { Appointment } from "@/types/appointment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Edit3, UserX, Trash2 } from "lucide-react";
import { isoToLocalHHMM } from "@/utils/date";
import { DeleteAppointmentModal } from "./DeleteAppointmentModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface AppointmentItemProps {
  appointment: Appointment;
  onUpdateStatus: (appointmentId: string, status: Appointment['status']) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete?: (appointmentId: string) => void;
  isDeleting?: boolean;
  style?: React.CSSProperties;
}

const statusConfig = {
  scheduled: { label: 'Agendado', color: 'bg-blue-500/10 border-blue-500/20 text-blue-700' },
  completed: { label: 'Realizado', color: 'bg-green-500/10 border-green-500/20 text-green-700' },
  no_show: { label: 'Faltou', color: 'bg-orange-500/10 border-orange-500/20 text-orange-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 border-red-500/20 text-red-700' }
};

export const AppointmentItem = ({ appointment, onUpdateStatus, onEdit, onDelete, isDeleting = false, style }: AppointmentItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();
  const currentStatusConfig = statusConfig[appointment.status];
  
  // Mostrar horário exato no timezone brasileiro
  const startTime = isoToLocalHHMM(appointment.start_datetime);
  const endTime = isoToLocalHHMM(appointment.end_datetime);

  const { elementRef } = useSwipeGesture({
    onSwipeRight: () => {
      triggerHaptic('light');
      onEdit(appointment);
    },
    onSwipeLeft: () => {
      triggerHaptic('light');
      if (appointment.status === 'scheduled') {
        handleStatusChange('completed');
      }
    },
    threshold: isMobile ? 80 : 120
  });

  const handleStatusChange = (newStatus: Appointment['status']) => {
    triggerHaptic('medium');
    onUpdateStatus(appointment.id, newStatus);
    setIsOpen(false);
  };

  const handleEdit = () => {
    triggerHaptic('light');
    onEdit(appointment);
    setIsOpen(false);
  };

  const handleDeleteClick = () => {
    triggerHaptic('light');
    setShowDeleteModal(true);
    setIsOpen(false);
  };

  const handleDeleteConfirm = (appointmentId: string) => {
    if (onDelete) {
      triggerHaptic('medium');
      onDelete(appointmentId);
    }
  };

  const handleOpen = () => {
    triggerHaptic('light');
    setIsOpen(true);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div 
          ref={elementRef}
          onClick={handleOpen}
          className={`
            ${currentStatusConfig.color} 
            rounded 
            ${isMobile ? 'p-3 text-sm min-h-[60px]' : 'p-1 text-xs'} 
            cursor-pointer hover:opacity-80 transition-all duration-200 
            w-full overflow-hidden
            ${isMobile ? 'touch-target active:scale-95' : ''}
          `}
          style={style}
        >
          <div className={`font-medium truncate flex items-center justify-between ${isMobile ? 'text-base' : ''}`}>
            <span className={`
              ${isMobile ? 'text-xs' : 'text-[10px]'} 
              font-mono bg-black/10 px-1 rounded flex-shrink-0
            `}>
              {startTime}-{endTime}
            </span>
          </div>
          {appointment.patient_name && (
            <div className={`text-muted-foreground truncate mt-0.5 ${isMobile ? 'text-sm' : 'text-[10px]'}`}>
              {appointment.patient_name}
            </div>
          )}
          <Badge variant="outline" className={`mt-1 ${isMobile ? 'text-xs h-5 px-2' : 'text-[9px] h-3 px-1'}`}>
            {currentStatusConfig.label}
          </Badge>
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem 
          onClick={() => handleStatusChange('completed')}
          disabled={appointment.status === 'completed'}
          className="cursor-pointer"
        >
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Marcar como Realizado
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleStatusChange('no_show')}
          disabled={appointment.status === 'no_show'}
          className="cursor-pointer"
        >
          <UserX className="h-4 w-4 mr-2 text-orange-600" />
          Marcar como Faltou
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleStatusChange('cancelled')}
          disabled={appointment.status === 'cancelled'}
          className="cursor-pointer"
        >
          <XCircle className="h-4 w-4 mr-2 text-red-600" />
          Marcar como Cancelado
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleStatusChange('scheduled')}
          disabled={appointment.status === 'scheduled'}
          className="cursor-pointer"
        >
          <Clock className="h-4 w-4 mr-2 text-blue-600" />
          Marcar como Agendado
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Edit3 className="h-4 w-4 mr-2" />
          Editar Agendamento
        </DropdownMenuItem>
        
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteClick} 
              className="cursor-pointer text-destructive focus:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Agendamento
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>

      <DeleteAppointmentModal
        appointment={appointment}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </DropdownMenu>
  );
};