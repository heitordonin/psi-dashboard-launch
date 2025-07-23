import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Appointment } from "@/types/appointment";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeleteAppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (appointmentId: string) => void;
  isDeleting?: boolean;
}

export function DeleteAppointmentModal({ 
  appointment, 
  isOpen, 
  onClose, 
  onConfirmDelete,
  isDeleting = false 
}: DeleteAppointmentModalProps) {
  if (!appointment) return null;

  const appointmentDate = format(new Date(appointment.start_datetime), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });

  const handleConfirm = () => {
    onConfirmDelete(appointment.id);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir agendamento</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Tem certeza que deseja excluir este agendamento?</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{appointment.title}</p>
              {appointment.patient_name && (
                <p className="text-sm text-muted-foreground">Paciente: {appointment.patient_name}</p>
              )}
              <p className="text-sm text-muted-foreground">{appointmentDate}</p>
            </div>
            <p className="text-sm text-destructive font-medium">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}