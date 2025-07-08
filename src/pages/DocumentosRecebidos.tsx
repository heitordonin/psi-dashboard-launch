import React from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentsList } from '@/components/documents/DocumentsList';
import { useAdminDocuments } from '@/hooks/useAdminDocuments';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate } from 'react-router-dom';

const DocumentosRecebidos = () => {
  const { currentPlan } = useSubscription();
  const { documents, isLoading } = useAdminDocuments();

  // Redirect if not Psi Regular plan
  if (currentPlan && currentPlan.slug !== 'psi_regular') {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Documentos Recebidos</h1>
            <p className="text-muted-foreground">
              Gerencie os documentos enviados pela administração
            </p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">
                  {documents.filter(d => d.status === 'paid').length}
                </div>
                <div className="text-sm text-muted-foreground">Pagos</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-yellow-600">
                  {documents.filter(d => d.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">A vencer</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-600">
                  {documents.filter(d => d.status === 'overdue').length}
                </div>
                <div className="text-sm text-muted-foreground">Em atraso</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Seus Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentsList documents={documents} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentosRecebidos;