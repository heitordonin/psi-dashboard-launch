import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Trash2, User, Calendar, DollarSign, FileText, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface UploadedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  user_id?: string;
  competency?: string;
  due_date?: string;
  amount?: number;
  observations?: string;
  isComplete: boolean;
  isSent?: boolean;
}

interface User {
  id: string;
  full_name?: string;
  display_name?: string;
}

interface DocumentsUploadTableProps {
  documents: UploadedDocument[];
  users: User[];
  onEdit: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onSendSingle?: (id: string) => void;
  isLoading: boolean;
}

export const DocumentsUploadTable = ({
  documents,
  users,
  onEdit,
  onDelete,
  onSendSingle,
  isLoading
}: DocumentsUploadTableProps) => {
  const navigate = useNavigate();
  const getUserName = (userId?: string) => {
    if (!userId) return "Não selecionado";
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.display_name || "Usuário não encontrado";
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Não informado";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const handleEdit = (document: UploadedDocument) => {
    // Store document data in sessionStorage for persistence across navigation
    sessionStorage.setItem('editingDocument', JSON.stringify(document));
    navigate(`/admin/documento/${document.id}/editar`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Arquivo
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Usuário
                </div>
              </TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Competência
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Vencimento
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium">
                  <div className="truncate max-w-[180px]" title={document.fileName}>
                    {document.fileName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px] truncate">
                    {getUserName(document.user_id)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">DARF Carnê-Leão</Badge>
                </TableCell>
                <TableCell>{formatDate(document.competency)}</TableCell>
                <TableCell>{formatDate(document.due_date)}</TableCell>
                <TableCell>{formatCurrency(document.amount)}</TableCell>
                <TableCell>
                  <Badge variant={
                    document.isSent ? "secondary" : 
                    document.isComplete ? "default" : "destructive"
                  }>
                    {document.isSent ? "Enviado" : 
                     document.isComplete ? "Completo" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!document.isSent && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(document)}
                          disabled={isLoading}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        {document.isComplete && onSendSingle && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSendSingle(document.id)}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Enviar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(document.id)}
                          disabled={isLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    {document.isSent && (
                      <Badge variant="secondary">Documento Enviado</Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {documents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum documento carregado</p>
        </div>
      )}
    </div>
  );
};