import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Mail, 
  MessageCircle, 
  XCircle,
  TrendingUp,
  Zap,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { 
  useReminderSystemMetrics, 
  useReminderSystemMonitoring, 
  getHealthStatus, 
  formatDuration, 
  getSeverityColor, 
  getLogLevelColor 
} from "@/hooks/useReminderSystemMetrics";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ReminderSystemDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [monitoringMode, setMonitoringMode] = useState(false);

  const {
    data: metrics,
    isLoading,
    error,
    refetch
  } = useReminderSystemMetrics(
    dateRange.startDate,
    dateRange.endDate,
    !monitoringMode
  );

  const {
    data: monitoringData,
    isLoading: isMonitoringLoading
  } = useReminderSystemMonitoring();

  const currentData = monitoringMode ? monitoringData : metrics;
  const currentLoading = monitoringMode ? isMonitoringLoading : isLoading;

  const healthStatus = currentData ? getHealthStatus(currentData) : 'critical';

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (currentLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando métricas do sistema...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar métricas</AlertTitle>
        <AlertDescription>
          {error.message || 'Erro desconhecido ao buscar métricas do sistema'}
          <Button onClick={() => refetch()} className="ml-2" size="sm">
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sem dados disponíveis</AlertTitle>
        <AlertDescription>
          Nenhuma métrica foi encontrada para o período selecionado.
        </AlertDescription>
      </Alert>
    );
  }

  const { overall_statistics, alerts_summary, logs_summary, daily_metrics, recent_executions, active_alerts, recent_logs } = currentData;

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Lembretes</h2>
          <p className="text-muted-foreground">Monitoramento e métricas de performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={monitoringMode ? "default" : "outline"}
              size="sm"
              onClick={() => setMonitoringMode(!monitoringMode)}
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>{monitoringMode ? 'Tempo Real' : 'Histórico'}</span>
            </Button>
          </div>
          
          {!monitoringMode && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="start-date" className="text-sm">De:</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-auto"
              />
              <Label htmlFor="end-date" className="text-sm">Até:</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Status geral do sistema */}
      <Card className={`border-2 ${getHealthStatusColor(healthStatus)}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {healthStatus === 'healthy' && <CheckCircle className="h-5 w-5" />}
            {healthStatus === 'warning' && <AlertTriangle className="h-5 w-5" />}
            {healthStatus === 'critical' && <XCircle className="h-5 w-5" />}
            <span>Status do Sistema: {healthStatus === 'healthy' ? 'Saudável' : healthStatus === 'warning' ? 'Atenção' : 'Crítico'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Taxa de Sucesso das Execuções</div>
              <div className="text-2xl font-bold">{overall_statistics.success_rate_percentage}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Taxa de Sucesso dos Lembretes</div>
              <div className="text-2xl font-bold">{overall_statistics.overall_reminder_success_rate}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Tempo Médio de Execução</div>
              <div className="text-2xl font-bold">{formatDuration(overall_statistics.avg_duration_ms)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Alertas Ativos</div>
              <div className="text-2xl font-bold text-red-600">{alerts_summary.total_active_alerts}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overall_statistics.total_executions}</div>
            <p className="text-xs text-muted-foreground">
              {overall_statistics.successful_executions} sucessos, {overall_statistics.failed_executions} falhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lembretes Processados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overall_statistics.total_reminders_processed}</div>
            <p className="text-xs text-muted-foreground">
              {overall_statistics.total_successful_reminders} enviados com sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-mails Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recent_logs?.filter(log => log.reminder_type === 'email' && log.log_level === 'info' && log.message.includes('sent successfully')).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Lembretes por e-mail</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Enviados</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recent_logs?.filter(log => log.reminder_type === 'whatsapp' && log.log_level === 'info' && log.message.includes('sent successfully')).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Lembretes por WhatsApp</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas ativos */}
      {active_alerts && active_alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Alertas Ativos ({active_alerts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {active_alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm">{alert.message}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.triggered_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Tabs com detalhes */}
      <Tabs defaultValue="executions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="executions">Execuções</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="daily">Métricas Diárias</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Execuções Recentes</CardTitle>
              <CardDescription>Últimas 20 execuções do sistema de lembretes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {recent_executions?.slice(0, 20).map((execution) => (
                    <div key={execution.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">ID: {execution.execution_id}</div>
                          <div className="text-sm text-muted-foreground">
                            {execution.total_reminders} lembretes • {execution.successful_reminders} sucessos • {execution.failed_reminders} falhas
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={execution.status === 'success' ? 'default' : execution.status === 'error' ? 'destructive' : 'secondary'}
                          >
                            {execution.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDuration(execution.duration_ms || 0)} • {format(new Date(execution.started_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>Últimos 50 eventos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {recent_logs?.slice(0, 50).map((log) => (
                    <div key={log.id} className="text-xs font-mono border-l-2 pl-2 py-1 border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getLogLevelColor(log.log_level)}>
                            {log.log_level.toUpperCase()}
                          </Badge>
                          <span>{log.message}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {format(new Date(log.timestamp), 'dd/MM HH:mm:ss', { locale: ptBR })}
                        </span>
                      </div>
                      {log.context && Object.keys(log.context).length > 0 && (
                        <div className="mt-1 text-gray-500">
                          {JSON.stringify(log.context, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Métricas Diárias</CardTitle>
              <CardDescription>Resumo de performance por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {daily_metrics?.map((daily, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          {format(new Date(daily.execution_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <Badge variant={daily.success_rate_percentage >= 90 ? 'default' : daily.success_rate_percentage >= 70 ? 'secondary' : 'destructive'}>
                          {daily.success_rate_percentage.toFixed(1)}% sucesso
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Execuções</div>
                          <div className="font-bold">{daily.total_executions}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Lembretes</div>
                          <div className="font-bold">{daily.total_reminders_sent}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Sucessos</div>
                          <div className="font-bold text-green-600">{daily.total_successful_reminders}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Falhas</div>
                          <div className="font-bold text-red-600">{daily.total_failed_reminders}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Tempos de Resposta</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Tempo médio de execução</div>
                  <div className="text-2xl font-bold">{formatDuration(overall_statistics.avg_duration_ms)}</div>
                </div>
                <div className="space-y-2">
                  {recent_executions?.slice(0, 5).map((execution) => (
                    <div key={execution.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{execution.execution_id.slice(-8)}</span>
                      <span>{formatDuration(execution.duration_ms || 0)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total bloqueados por rate limit</div>
                  <div className="text-2xl font-bold">{overall_statistics.total_rate_limited_reminders}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Lembretes que não foram enviados devido aos limites de taxa configurados
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};