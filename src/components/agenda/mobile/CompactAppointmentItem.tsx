import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/types/appointment";

interface CompactAppointmentItemProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
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
  onEdit 
}: CompactAppointmentItemProps) => {
  const startTime = format(new Date(appointment.start_datetime), "HH:mm", { locale: ptBR });
  const endTime = format(new Date(appointment.end_datetime), "HH:mm", { locale: ptBR });
  const config = statusConfig[appointment.status];

  return (
    <div 
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${config.className}`}
      onClick={() => onEdit(appointment)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">{config.label}</span>
            <span className="text-sm font-mono">{startTime}-{endTime}</span>
          </div>
          {appointment.patient_name && (
            <p className="text-sm truncate">{appointment.patient_name}</p>
          )}
        </div>
      </div>
    </div>
  );
};