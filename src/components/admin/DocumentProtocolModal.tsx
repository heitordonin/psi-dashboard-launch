import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SentDocument, useAdminSentDocuments } from "@/hooks/useAdminSentDocuments";
import { FileText, Download, Calendar, DollarSign, User, Building } from "lucide-react";

interface DocumentProtocolModalProps {
  document: SentDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentProtocolModal = ({
  document,
  isOpen,
  onClose,
}: DocumentProtocolModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { getDocumentUrl, getStatusBadgeVariant, getStatusLabel } = useAdminSentDocuments();

  if (!document) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const url = await getDocumentUrl(document.file_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setIsDownloading(false);
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Protocolo do Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={getStatusBadgeVariant(document.status)}
              className="text-sm px-4 py-2"
            >
              {getStatusLabel(document.status)}
            </Badge>
          </div>

          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informações do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Categoria/Obrigação
                  </label>
                  <p className="text-sm font-semibold">{document.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Protocolo
                  </label>
                  <p className="text-sm font-mono">{document.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Competência
                    </label>
                    <p className="text-sm font-semibold">{formatCompetency(document.competency)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Vencimento
                    </label>
                    <p className="text-sm font-semibold">{formatDate(document.due_date)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Valor
                  </label>
                  <p className="text-lg font-bold text-primary">{formatCurrency(document.amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nome do Cliente
                </label>
                <p className="text-sm font-semibold">{document.user_profile?.full_name || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datas Importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Data de Envio
                  </label>
                  <p className="text-sm">{formatDate(document.created_at)}</p>
                </div>
                {document.marked_as_paid_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Marcado como Pago em
                    </label>
                    <p className="text-sm">{formatDate(document.marked_as_paid_at)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Baixando...' : 'Baixar Documento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};