import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface SubscriptionSyncState {
  isLoading: boolean;
  lastSyncTime: number | null;
  error: string | null;
}

interface SubscriptionSyncContextType {
  state: SubscriptionSyncState;
  syncSubscription: (force?: boolean) => Promise<{ success: boolean; data?: any; error?: any }>;
  forceSync: () => Promise<{ success: boolean; data?: any; error?: any }>;
}

const SubscriptionSyncContext = createContext<SubscriptionSyncContextType | undefined>(undefined);

export const useSubscriptionSync = () => {
  const context = useContext(SubscriptionSyncContext);
  if (!context) {
    throw new Error('useSubscriptionSync must be used within a SubscriptionSyncProvider');
  }
  return context;
};

interface SubscriptionSyncProviderProps {
  children: React.ReactNode;
}

export const SubscriptionSyncProvider: React.FC<SubscriptionSyncProviderProps> = ({ children }) => {
  const [state, setState] = useState<SubscriptionSyncState>({
    isLoading: false,
    lastSyncTime: null,
    error: null,
  });
  
  const queryClient = useQueryClient();
  const syncMutexRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<{ data: any; timestamp: number } | null>(null);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    queryClient.invalidateQueries({ queryKey: ['patient-limit'] });
    queryClient.invalidateQueries({ queryKey: ['plan-features'] });
  }, [queryClient]);

  const performSync = useCallback(async (isForced = false): Promise<{ success: boolean; data?: any; error?: any }> => {
    // Verificar se já há uma sincronização em andamento
    if (syncMutexRef.current) {
      console.log('[SYNC-MUTEX] Sincronização já em andamento, aguardando...');
      return { success: false, error: 'Sync already in progress' };
    }

    // Verificar cache se não for forçado
    if (!isForced && cacheRef.current) {
      const cacheAge = Date.now() - cacheRef.current.timestamp;
      const cacheValidityTime = 30 * 1000; // 30 segundos
      
      if (cacheAge < cacheValidityTime) {
        console.log('[SYNC-MUTEX] Retornando dados do cache');
        return { success: true, data: cacheRef.current.data };
      }
    }

    // Adquirir mutex
    syncMutexRef.current = true;
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      console.log(`[SYNC-MUTEX] Iniciando sincronização ${isForced ? '(forçada)' : '(normal)'}`);
      
      const functionName = isForced ? 'force-subscription-sync' : 'check-stripe-subscription';
      const body = isForced ? { userId: 'current' } : undefined;
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body
      });

      if (error) {
        throw error;
      }

      // Atualizar cache
      cacheRef.current = {
        data,
        timestamp: Date.now()
      };

      // Invalidar queries
      invalidateQueries();

      const now = Date.now();
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: now,
        error: null,
      }));

      console.log('[SYNC-MUTEX] Sincronização concluída com sucesso');
      return { success: true, data };

    } catch (error) {
      console.error('[SYNC-MUTEX] Erro na sincronização:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }));

      return { success: false, error };
    } finally {
      // Liberar mutex
      syncMutexRef.current = false;
    }
  }, [invalidateQueries]);

  const syncSubscription = useCallback(async (force = false) => {
    // Limpar timeout anterior se existir
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Se for forçado, executar imediatamente
    if (force) {
      return performSync(false);
    }

    // Caso contrário, aplicar debounce
    return new Promise<{ success: boolean; data?: any; error?: any }>((resolve) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        const result = await performSync(false);
        resolve(result);
      }, 500); // 500ms de debounce
    });
  }, [performSync]);

  const forceSync = useCallback(async () => {
    return performSync(true);
  }, [performSync]);

  const value: SubscriptionSyncContextType = {
    state,
    syncSubscription,
    forceSync,
  };

  return (
    <SubscriptionSyncContext.Provider value={value}>
      {children}
    </SubscriptionSyncContext.Provider>
  );
};