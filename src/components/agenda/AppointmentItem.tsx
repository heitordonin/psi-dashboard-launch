import { useState } from "react";
import { Appointment } from "@/types/appointment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Edit3, UserX } from "lucide-react";

interface AppointmentItemProps {
  appointment: Appointment;
  onUpdateStatus: (appointmentId: string, status: Appointment['status']) => void;
  onEdit: (appointment: Appointment) => void;
}

const statusConfig = {
  scheduled: { label: 'Agendado', color: 'bg-blue-500/10 border-blue-500/20 text-blue-700' },
  completed: { label: 'Realizado', color: 'bg-green-500/10 border-green-500/20 text-green-700' },
  no_show: { label: 'Faltou', color: 'bg-orange-500/10 border-orange-500/20 text-orange-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 border-red-500/20 text-red-700' }
};

export const AppointmentItem = ({ appointment, onUpdateStatus, onEdit }: AppointmentItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStatusConfig = statusConfig[appointment.status];

  const handleStatusChange = (newStatus: Appointment['status']) => {
    onUpdateStatus(appointment.id, newStatus);
    setIsOpen(false);
  };

  const handleEdit = () => {
    onEdit(appointment);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className={`${currentStatusConfig.color} rounded p-1 mb-1 text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
          <div className="font-medium truncate">{appointment.title}</div>
          {appointment.patient_name && (
            <div className="text-muted-foreground truncate">
              {appointment.patient_name}
            </div>
          )}
          <Badge variant="outline" className="mt-1 text-[10px] h-4">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};