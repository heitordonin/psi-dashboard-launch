import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock, Zap } from 'lucide-react';
import { useSubscriptionMonitoring } from '@/hooks/useSubscriptionMonitoring';
import { useSubscriptionSecurity } from '@/hooks/useSubscriptionSecurity';
import { useSubscription } from '@/hooks/useSubscription';
import { useForceSyncSubscription } from '@/hooks/useForceSyncSubscription';
import { toast } from 'sonner';

export const SubscriptionHealthDashboard: React.FC = () => {
  const { health, runHealthCheck, monitoredSync } = useSubscriptionMonitoring();
  const { checkSubscriptionHealth } = useSubscriptionSecurity();
  const { currentPlan, userSubscription, isLoading } = useSubscription();
  const { mutate: forceSync, isPending: isSyncing } = useForceSyncSubscription();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleForceSync = () => {
    forceSync(undefined, {
      onSuccess: () => {
        toast.success('Sincronização forçada concluída!');
        runHealthCheck();
      },
      onError: (error) => {
        toast.error(`Erro na sincronização: ${error.message}`);
      }
    });
  };

  const handleQuickCheck = async () => {
    try {
      await runHealthCheck();
      toast.success('Verificação de saúde concluída');
    } catch (error) {
      toast.error('Erro na verificação de saúde');
    }
  };

  const subscriptionHealth = checkSubscriptionHealth();
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Nunca';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatLatency = (latency: number | null) => {
    if (!latency) return 'N/A';
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status do Sistema de Assinatura</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickCheck}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Verificar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceSync}
              disabled={isSyncing}
            >
              <Zap className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
              Forçar Sync
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {getStatusIcon(health.status)}
            <Badge variant="outline" className={getStatusColor(health.status)}>
              {health.status === 'healthy' && 'Sistema Saudável'}
              {health.status === 'warning' && 'Atenção Necessária'}
              {health.status === 'critical' && 'Crítico'}
            </Badge>
          </div>
          
          {health.issues.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Problemas detectados:</p>
              <ul className="text-sm space-y-1">
                {health.issues.map((issue, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações da Assinatura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assinatura Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plano:</span>
                <span className="text-sm font-medium">{currentPlan?.name || 'Carregando...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={userSubscription?.status === 'active' ? 'default' : 'secondary'}>
                  {userSubscription?.status || 'indefinido'}
                </Badge>
              </div>
              {userSubscription?.expires_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expira em:</span>
                  <span className="text-sm">{new Date(userSubscription.expires_at).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Saúde:</span>
                <Badge variant={subscriptionHealth.healthy ? 'default' : 'destructive'}>
                  {subscriptionHealth.healthy ? 'Ativa' : subscriptionHealth.reason}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Métricas de Sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Última sync:</span>
                <span className="text-sm">{formatDate(health.syncMetrics.lastSyncTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Latência:</span>
                <span className="text-sm">{formatLatency(health.syncMetrics.syncLatency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total de syncs:</span>
                <span className="text-sm">{health.syncMetrics.totalSyncs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Falhas consecutivas:</span>
                <Badge variant={health.syncMetrics.failureCount > 0 ? 'destructive' : 'default'}>
                  {health.syncMetrics.failureCount}
                </Badge>
              </div>
              {health.syncMetrics.lastFailure && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                  <p className="font-medium text-red-800">Último erro:</p>
                  <p className="text-red-600">{health.syncMetrics.lastFailure}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Informações de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1 font-mono bg-gray-50 p-2 rounded">
            <div>Última verificação: {formatDate(health.lastCheck)}</div>
            <div>Cache TTL: 15 minutos para sync normal, 30s para force</div>
            <div>Rate limit: 5 calls/minuto por usuário</div>
            <div>Background sync: A cada 6 horas</div>
            <div>Health check: A cada 5 minutos</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};