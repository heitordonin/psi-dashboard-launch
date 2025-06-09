
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmailLog } from "@/hooks/useEmailLogs";

interface EmailLogsListProps {
  logs: EmailLog[];
  isLoading: boolean;
}

export const EmailLogsList = ({ logs, isLoading }: EmailLogsListProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Mail className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falha</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Carregando logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum log encontrado</h3>
        <p className="text-gray-600">Não há registros de emails enviados ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <Card key={log.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(log.status)}
                <div>
                  <h4 className="font-medium text-gray-900">{log.recipient_email}</h4>
                  {log.patients?.full_name && (
                    <p className="text-sm text-gray-600">Paciente: {log.patients.full_name}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(log.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {log.subject && (
                <div>
                  <span className="font-medium text-gray-700">Assunto:</span>
                  <p className="text-gray-600">{log.subject}</p>
                </div>
              )}

              <div>
                <span className="font-medium text-gray-700">Tipo:</span>
                <p className="text-gray-600">{log.email_type}</p>
              </div>

              <div>
                <span className="font-medium text-gray-700">Criado em:</span>
                <p className="text-gray-600">{formatDate(log.created_at)}</p>
              </div>

              {log.sent_at && (
                <div>
                  <span className="font-medium text-gray-700">Enviado em:</span>
                  <p className="text-gray-600">{formatDate(log.sent_at)}</p>
                </div>
              )}
            </div>

            {log.error_message && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="font-medium text-red-800">Erro:</span>
                <p className="text-red-700 text-sm mt-1">{log.error_message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
