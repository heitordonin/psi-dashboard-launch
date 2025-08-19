import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEnhancedWhatsApp } from '@/hooks/useEnhancedWhatsApp';
import { AlertTriangle, CheckCircle, XCircle, Activity, MessageCircle, Database, Zap } from 'lucide-react';

export const WhatsAppSystemStatus = () => {
  const { systemHealth, isSystemHealthLoading, isHealthy, isDegraded, isUnhealthy } = useEnhancedWhatsApp();

  if (isSystemHealthLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sistema WhatsApp
          </CardTitle>
          <CardDescription>Carregando status do sistema...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!systemHealth) return null;

  const getStatusIcon = () => {
    if (isHealthy) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (isDegraded) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (isHealthy) return <Badge variant="default" className="bg-green-100 text-green-800">Saudável</Badge>;
    if (isDegraded) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degradado</Badge>;
    return <Badge variant="destructive">Indisponível</Badge>;
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Sistema WhatsApp
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Monitoramento em tempo real das funcionalidades do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Messaging Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Mensagens 24h</span>
            </div>
            <div className="text-2xl font-bold">{systemHealth.messaging.totalMessagesSent24h}</div>
            <Progress 
              value={systemHealth.messaging.successRate * 100} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              {(systemHealth.messaging.successRate * 100).toFixed(1)}% taxa de sucesso
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Latência Média</span>
            </div>
            <div className="text-2xl font-bold">
              {formatLatency(systemHealth.messaging.avgLatency)}
            </div>
            <div className="text-xs text-muted-foreground">
              Tempo de resposta do sistema
            </div>
          </div>
        </div>

        {/* Database & External Services */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Banco de Dados</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge 
                variant={systemHealth.database.connectionHealth === 'healthy' ? 'default' : 'destructive'}
                className={
                  systemHealth.database.connectionHealth === 'healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : systemHealth.database.connectionHealth === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : ''
                }
              >
                {systemHealth.database.connectionHealth}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Query: {formatLatency(systemHealth.database.avgQueryTime)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Twilio API</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge 
                variant={systemHealth.external.twilioHealth === 'healthy' ? 'default' : 'destructive'}
                className={
                  systemHealth.external.twilioHealth === 'healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : systemHealth.external.twilioHealth === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : ''
                }
              >
                {systemHealth.external.twilioHealth}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Latência: {formatLatency(systemHealth.external.avgTwilioLatency)}
            </div>
          </div>
        </div>

        {/* Rate Limiting Info */}
        {systemHealth.rateLimiting.usersHittingLimit > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              {systemHealth.rateLimiting.usersHittingLimit} usuário(s) próximo(s) do limite de rate
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Última atualização: {new Date(systemHealth.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};