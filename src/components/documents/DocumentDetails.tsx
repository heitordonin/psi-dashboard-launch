import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, FileText, Eye, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAdminDocuments } from '@/hooks/useAdminDocuments';
import { MarkAsPaidModal } from './MarkAsPaidModal';
import { MarkAsPaidData } from '@/types/adminDocument';
import { toast } from 'sonner';
import { createSafeDateFromString } from '@/utils/dateUtils';

export const DocumentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { documents, markAsPaid, isMarkingAsPaid, getDocumentUrl } = useAdminDocuments();
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);

  const document = documents.find(doc => doc.id === id);

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Documento não encontrado</h2>
          <Button onClick={() => navigate('/documentos-recebidos')}>
            Voltar para documentos
          </Button>
        </div>
      </div>
    );
  }

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
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  const handleViewDocument = async () => {
    try {
      const url = await getDocumentUrl(document.file_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error getting document URL:', error);
      toast.error('Erro ao abrir documento');
    }
  };

  const handleMarkAsPaid = (data: MarkAsPaidData) => {
    markAsPaid({ documentId: document.id, paymentData: data });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/documentos-recebidos')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold">Detalhes do Documento</h1>
      </div>

      <div className="grid gap-6">
        {/* Document Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{document.title}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Competência: {formatCompetency(document.competency)}
                  </p>
                </div>
              </div>
              {getStatusBadge(document.status)}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Document Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Informações Financeiras</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-medium">{formatCurrency(document.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vencimento:</span>
                      <span className="font-medium">
                        {format(new Date(document.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    {document.status === 'paid' && document.penalty_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Multa/Juros:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(document.penalty_amount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {document.status === 'paid' && document.paid_date && (
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Informações de Pagamento</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data do pagamento:</span>
                        <span className="font-medium">
                          {format(new Date(document.paid_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total pago:</span>
                        <span className="font-medium">
                          {formatCurrency(document.amount + document.penalty_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Documento</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={handleViewDocument}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar PDF
                    </Button>

                    {document.status === 'pending' && (
                      <Button
                        onClick={() => setShowMarkAsPaidModal(true)}
                        disabled={isMarkingAsPaid}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isMarkingAsPaid ? 'Processando...' : 'Marcar como Pago'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {document.status === 'paid' && (
              <>
                <Separator />
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Documento Pago</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Este documento foi marcado como pago e uma despesa foi automaticamente 
                    criada na categoria DARF Carnê-Leão.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mark as Paid Modal */}
      <MarkAsPaidModal
        open={showMarkAsPaidModal}
        onOpenChange={setShowMarkAsPaidModal}
        onConfirm={handleMarkAsPaid}
        isLoading={isMarkingAsPaid}
      />
    </div>
  );
};