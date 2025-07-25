import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { subscriptionDebouncing, DEBOUNCE_CONFIGS } from '@/utils/subscriptionDebouncing';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface SubscriptionSyncState {
  isLoading: boolean;
  lastSyncTime: number | null;
  error: string | null;
}

interface SubscriptionSyncContextType {
  state: SubscriptionSyncState;
  syncSubscription: (context?: keyof typeof DEBOUNCE_CONFIGS) => Promise<{ success: boolean; data?: any; error?: any }>;
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
  const { user } = useAuth();

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    queryClient.invalidateQueries({ queryKey: ['patient-limit'] });
    queryClient.invalidateQueries({ queryKey: ['plan-features'] });
  }, [queryClient]);

  // Função principal que executa a sincronização
  const executeSync = useCallback(async (isForced = false) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const functionName = isForced ? 'force-subscription-sync' : 'check-stripe-subscription';
      const body = isForced ? { userId: 'current' } : undefined;
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;

      // Invalidar queries
      invalidateQueries();

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: Date.now(),
        error: null,
      }));

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [user?.id, invalidateQueries]);

  // Sincronização normal com debouncing contextual
  const syncSubscription = useCallback(async (context: keyof typeof DEBOUNCE_CONFIGS = 'MANUAL_SYNC') => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const config = DEBOUNCE_CONFIGS[context];
      const key = `sync-${user.id}`;
      
      const data = await subscriptionDebouncing.debouncedCall(
        key,
        user.id,
        () => executeSync(false),
        config
      );
      
      return { success: true, data };
    } catch (error) {
      console.error('[SUBSCRIPTION-SYNC] Erro na sincronização:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, [user?.id, executeSync]);

  // Sincronização forçada
  const forceSync = useCallback(async () => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      // Limpar cache antes do force sync
      subscriptionDebouncing.invalidateCache(user.id);
      
      const config = DEBOUNCE_CONFIGS.FORCE_SYNC;
      const key = `force-${user.id}`;
      
      const data = await subscriptionDebouncing.debouncedCall(
        key,
        user.id,
        () => executeSync(true),
        config
      );
      
      return { success: true, data };
    } catch (error) {
      console.error('[SUBSCRIPTION-SYNC] Erro na sincronização forçada:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, [user?.id, executeSync]);

  // Limpar dados do usuário no logout
  useEffect(() => {
    if (!user?.id) {
      // Limpar dados do sistema de debouncing
      subscriptionDebouncing.clearUserData('current-user');
    }
  }, [user?.id]);

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