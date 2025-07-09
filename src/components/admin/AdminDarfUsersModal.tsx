import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAdminDarfControl } from "@/hooks/useAdminDarfControl";
import { format } from "date-fns";
import { User, CheckCircle } from "lucide-react";

interface AdminDarfUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  competency: string;
  pendingUsers: Array<{
    user_id: string;
    profiles: {
      id: string;
      full_name: string;
      cpf: string;
      email: string;
    };
  }>;
}

export const AdminDarfUsersModal = ({
  isOpen,
  onClose,
  competency,
  pendingUsers
}: AdminDarfUsersModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const { markAsCompleted, isMarkingCompleted } = useAdminDarfControl(competency);

  const handleMarkAsCompleted = () => {
    if (!selectedUserId || !notes.trim()) return;

    markAsCompleted(
      { userId: selectedUserId, notes: notes.trim() },
      {
        onSuccess: () => {
          setSelectedUserId(null);
          setNotes("");
        }
      }
    );
  };

  const formatCompetency = (comp: string) => {
    try {
      return format(new Date(comp + '-01'), 'MMMM yyyy');
    } catch {
      return comp;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Usuários Psi Regular sem DARF - Vencimento {formatCompetency(competency)}
          </DialogTitle>
        </DialogHeader>

        {pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-medium">Todos os DARFs foram enviados!</h3>
            <p className="text-muted-foreground">
              Não há usuários Psi Regular pendentes para este vencimento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {pendingUsers.length} usuário(s) pendente(s) encontrado(s)
            </div>

            <div className="grid gap-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.user_id}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedUserId === user.user_id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{user.profiles.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        CPF: {user.profiles.cpf} | Email: {user.profiles.email}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedUserId === user.user_id ? "default" : "outline"}
                      onClick={() => setSelectedUserId(
                        selectedUserId === user.user_id ? null : user.user_id
                      )}
                    >
                      {selectedUserId === user.user_id ? "Selecionado" : "Selecionar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedUserId && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">
                      Observações para conclusão manual *
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Ex: Usuário isento de DARF, Enviado por outro meio, etc."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleMarkAsCompleted}
                      disabled={!notes.trim() || isMarkingCompleted}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isMarkingCompleted ? "Marcando..." : "Marcar como Concluído"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUserId(null);
                        setNotes("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};