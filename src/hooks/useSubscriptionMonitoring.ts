import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSubscriptionSync } from '@/contexts/SubscriptionSyncContext';

interface SyncMetrics {
  lastSyncTime: number | null;
  syncLatency: number | null;
  failureCount: number;
  lastFailure: string | null;
  totalSyncs: number;
}

interface SubscriptionHealth {
  status: 'healthy' | 'warning' | 'critical';
  lastCheck: number | null;
  issues: string[];
  syncMetrics: SyncMetrics;
}

/**
 * Hook para monitoramento da saúde do sistema de assinatura
 */
export const useSubscriptionMonitoring = () => {
  const { user } = useAuth();
  const { state, syncSubscription } = useSubscriptionSync();
  const [health, setHealth] = useState<SubscriptionHealth>({
    status: 'healthy',
    lastCheck: null,
    issues: [],
    syncMetrics: {
      lastSyncTime: null,
      syncLatency: null,
      failureCount: 0,
      lastFailure: null,
      totalSyncs: 0
    }
  });

  // Carregar métricas do localStorage
  const loadMetrics = useCallback(() => {
    if (!user?.id) return;

    try {
      const stored = localStorage.getItem(`subscription-metrics-${user.id}`);
      if (stored) {
        const metrics = JSON.parse(stored);
        setHealth(prev => ({
          ...prev,
          syncMetrics: { ...prev.syncMetrics, ...metrics }
        }));
      }
    } catch (error) {
      console.warn('[MONITORING] Erro ao carregar métricas:', error);
    }
  }, [user?.id]);

  // Salvar métricas no localStorage
  const saveMetrics = useCallback((metrics: Partial<SyncMetrics>) => {
    if (!user?.id) return;

    try {
      const current = health.syncMetrics;
      const updated = { ...current, ...metrics };
      localStorage.setItem(`subscription-metrics-${user.id}`, JSON.stringify(updated));
      
      setHealth(prev => ({
        ...prev,
        syncMetrics: updated
      }));
    } catch (error) {
      console.warn('[MONITORING] Erro ao salvar métricas:', error);
    }
  }, [user?.id, health.syncMetrics]);

  // Registrar início de sincronização
  const recordSyncStart = useCallback(() => {
    return Date.now();
  }, []);

  // Registrar conclusão de sincronização
  const recordSyncComplete = useCallback((startTime: number, success: boolean, error?: string) => {
    const latency = Date.now() - startTime;
    const now = Date.now();

    saveMetrics({
      lastSyncTime: now,
      syncLatency: latency,
      failureCount: success ? 0 : health.syncMetrics.failureCount + 1,
      lastFailure: success ? null : error || 'Erro desconhecido',
      totalSyncs: health.syncMetrics.totalSyncs + 1
    });

    console.log(`[MONITORING] Sync ${success ? 'sucesso' : 'falha'} - Latência: ${latency}ms`);
  }, [health.syncMetrics.failureCount, health.syncMetrics.totalSyncs, saveMetrics]);

  // Executar verificação de saúde
  const runHealthCheck = useCallback(async () => {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Verificar se sincronização está funcionando
    if (state.error) {
      issues.push(`Erro na sincronização: ${state.error}`);
      status = 'critical';
    }

    // Verificar latência alta
    if (health.syncMetrics.syncLatency && health.syncMetrics.syncLatency > 10000) {
      issues.push('Latência alta na sincronização (>10s)');
      if (status === 'healthy') status = 'warning';
    }

    // Verificar falhas frequentes
    if (health.syncMetrics.failureCount >= 3) {
      issues.push(`Múltiplas falhas consecutivas (${health.syncMetrics.failureCount})`);
      status = 'critical';
    }

    // Verificar se não sincronizou recentemente
    const now = Date.now();
    const lastCheck = localStorage.getItem(`subscription-last-check-${user?.id}`);
    if (lastCheck) {
      const timeSinceLastCheck = now - parseInt(lastCheck);
      if (timeSinceLastCheck > 60 * 60 * 1000) { // 1 hora
        issues.push('Sincronização atrasada (>1h)');
        if (status === 'healthy') status = 'warning';
      }
    }

    setHealth(prev => ({
      ...prev,
      status,
      lastCheck: now,
      issues
    }));

    return { status, issues };
  }, [state.error, health.syncMetrics, user?.id]);

  // Forçar sincronização com monitoramento
  const monitoredSync = useCallback(async (context?: keyof typeof import('@/utils/subscriptionDebouncing').DEBOUNCE_CONFIGS) => {
    const startTime = recordSyncStart();
    
    try {
      const result = await syncSubscription(context);
      recordSyncComplete(startTime, result.success, result.error?.toString());
      return result;
    } catch (error) {
      recordSyncComplete(startTime, false, error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    }
  }, [syncSubscription, recordSyncStart, recordSyncComplete]);

  // Background job para verificação periódica
  useEffect(() => {
    if (!user?.id) return;

    loadMetrics();

    // Verificação de saúde a cada 5 minutos
    const healthInterval = setInterval(runHealthCheck, 5 * 60 * 1000);
    
    // Sincronização preventiva a cada 6 horas
    const syncInterval = setInterval(() => {
      console.log('[MONITORING] Background sync iniciado...');
      monitoredSync('AUTO_CHECK').catch(error => {
        console.error('[MONITORING] Background sync falhou:', error);
      });
    }, 6 * 60 * 60 * 1000);

    // Verificação inicial
    runHealthCheck();

    return () => {
      clearInterval(healthInterval);
      clearInterval(syncInterval);
    };
  }, [user?.id, loadMetrics, runHealthCheck, monitoredSync]);

  // Limpar dados ao trocar usuário
  useEffect(() => {
    if (!user?.id) {
      setHealth({
        status: 'healthy',
        lastCheck: null,
        issues: [],
        syncMetrics: {
          lastSyncTime: null,
          syncLatency: null,
          failureCount: 0,
          lastFailure: null,
          totalSyncs: 0
        }
      });
    }
  }, [user?.id]);

  return {
    health,
    runHealthCheck,
    monitoredSync,
    recordSyncStart,
    recordSyncComplete
  };
};