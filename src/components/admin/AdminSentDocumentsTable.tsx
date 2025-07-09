import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SentDocument, useAdminSentDocuments } from "@/hooks/useAdminSentDocuments";
import { DocumentProtocolModal } from "./DocumentProtocolModal";
import { FileText, Trash2, Eye } from "lucide-react";
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

interface AdminSentDocumentsTableProps {
  filteredUserId: string | null;
  showAllUsers: boolean;
}

export const AdminSentDocumentsTable = ({
  filteredUserId,
  showAllUsers,
}: AdminSentDocumentsTableProps) => {
  const [selectedDocument, setSelectedDocument] = useState<SentDocument | null>(null);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);

  const {
    sentDocuments,
    isLoading,
    removeFromUserPanel,
    isRemoving,
    getStatusBadgeVariant,
    getStatusLabel,
  } = useAdminSentDocuments(filteredUserId, showAllUsers);

  const formatCompetency = (competency: string) => {
    // Assuming competency is in YYYY-MM format, convert to MM/YYYY
    const [year, month] = competency.split('-');
    return `${month}/${year}`;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleViewProtocol = (document: SentDocument) => {
    setSelectedDocument(document);
    setIsProtocolModalOpen(true);
  };

  const handleRemoveFromPanel = (documentId: string) => {
    removeFromUserPanel(documentId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Carregando documentos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos Enviados
            {!showAllUsers && ' (Filtrado)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sentDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum documento foi enviado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Categoria</th>
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-left p-2">Competência</th>
                    <th className="text-left p-2">Vencimento</th>
                    <th className="text-left p-2">Valor</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sentDocuments.slice(0, 20).map((document) => (
                    <tr key={document.id} className="border-b">
                      <td className="p-2 font-medium">{document.title}</td>
                      <td className="p-2">{document.user_profile?.full_name || 'N/A'}</td>
                      <td className="p-2">{formatCompetency(document.competency)}</td>
                      <td className="p-2">{formatDate(document.due_date)}</td>
                      <td className="p-2 font-semibold">{formatCurrency(document.amount)}</td>
                      <td className="p-2">
                        <Badge variant={getStatusBadgeVariant(document.status)}>
                          {getStatusLabel(document.status)}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProtocol(document)}
                            className="h-8 w-8 p-0"
                            title="Ver Protocolo"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {document.status !== 'deleted' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  title="Remover do Painel do Usuário"
                                  disabled={isRemoving}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover este documento do painel do usuário?
                                  O documento continuará visível para você, mas o usuário não poderá mais vê-lo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemoveFromPanel(document.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {sentDocuments.length > 20 && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Mostrando os primeiros 20 documentos de {sentDocuments.length} total.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentProtocolModal
        document={selectedDocument}
        isOpen={isProtocolModalOpen}
        onClose={() => {
          setIsProtocolModalOpen(false);
          setSelectedDocument(null);
        }}
      />
    </>
  );
};