import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAdminDarfControl } from "@/hooks/useAdminDarfControl";
import { format } from "date-fns";
import { User, FileText, Clock, X, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminDarfSentUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueMonth: string;
  sentUsers: Array<{
    user_id: string;
    profiles: {
      id: string;
      full_name: string;
      cpf: string;
    };
    darf_document: {
      title: string;
      status: string;
      created_at: string;
    } | null;
    manual_completion: {
      admin_notes: string;
      marked_completed_at: string;
    } | null;
    completion_type: 'document' | 'manual';
  }>;
}

export const AdminDarfSentUsersModal = ({
  isOpen,
  onClose,
  dueMonth,
  sentUsers
}: AdminDarfSentUsersModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { unmarkCompleted, isUnmarkingCompleted } = useAdminDarfControl(dueMonth);

  const handleUnmarkCompleted = (userId: string) => {
    unmarkCompleted({ userId });
    setSelectedUserId(null);
  };

  const formatDueMonth = (month: string) => {
    try {
      return format(new Date(month + '-01'), 'MMMM yyyy');
    } catch {
      return month;
    }
  };

  const getCompletionStatusBadge = (user: typeof sentUsers[0]) => {
    if (user.completion_type === 'document') {
      const status = user.darf_document?.status;
      switch (status) {
        case 'paid':
          return <Badge variant="default" className="bg-success text-success-foreground">Documento Pago</Badge>;
        case 'pending':
          return <Badge variant="secondary">Documento Pendente</Badge>;
        case 'overdue':
          return <Badge variant="destructive">Documento Vencido</Badge>;
        default:
          return <Badge variant="outline">Documento Enviado</Badge>;
      }
    } else {
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Conclusão Manual</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            DARFs Enviados - Vencimento {formatDueMonth(dueMonth)}
          </DialogTitle>
        </DialogHeader>

        {sentUsers.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhum DARF enviado</h3>
            <p className="text-muted-foreground">
              Ainda não há usuários com DARF enviado para este vencimento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {sentUsers.length} usuário(s) com DARF enviado
            </div>

            <div className="grid gap-4">
              {sentUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{user.profiles.full_name}</div>
                        {getCompletionStatusBadge(user)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        CPF: {user.profiles.cpf}
                      </div>

                      {user.completion_type === 'document' && user.darf_document && (
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{user.darf_document.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Enviado em {format(new Date(user.darf_document.created_at), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </div>
                      )}

                      {user.completion_type === 'manual' && user.manual_completion && (
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Marcado manualmente em {format(new Date(user.manual_completion.marked_completed_at), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                          <div className="bg-muted p-2 rounded text-xs">
                            <strong>Observações:</strong> {user.manual_completion.admin_notes}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {user.completion_type === 'manual' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Desmarcar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-warning" />
                                Confirmar Desmarcação
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja desmarcar a conclusão manual do DARF para{" "}
                                <strong>{user.profiles.full_name}</strong>?
                                <br />
                                <br />
                                O usuário voltará para a lista de pendentes e precisará ter o DARF
                                enviado novamente ou ser marcado como concluído manualmente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleUnmarkCompleted(user.user_id)}
                                disabled={isUnmarkingCompleted}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {isUnmarkingCompleted ? "Desmarcando..." : "Sim, Desmarcar"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};