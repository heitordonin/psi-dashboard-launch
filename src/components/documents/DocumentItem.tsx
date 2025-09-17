import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminDocument } from '@/types/adminDocument';
import { useNavigate } from 'react-router-dom';
import { createSafeDateFromString } from '@/utils/dateUtils';

interface DocumentItemProps {
  document: AdminDocument;
  onViewDocument: (filePath: string) => void;
}

export const DocumentItem = ({ document, onViewDocument }: DocumentItemProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Em atraso</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">A vencer</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCompetency = (competency: string) => {
    const date = createSafeDateFromString(competency);
    return format(date, "MM/yyyy", { locale: ptBR });
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground mb-1 truncate">
                {document.title}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Valor:</span> {formatCurrency(document.amount)}
                </div>
                <div>
                  <span className="font-medium">Vencimento:</span>{' '}
                  {format(new Date(document.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div>
                  <span className="font-medium">Competência:</span> {formatCompetency(document.competency)}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(document.status)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDocument(document.file_path);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver PDF
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate(`/documento/${document.id}`)}
            >
              Detalhes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};