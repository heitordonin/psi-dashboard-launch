/**
 * Hook de compatibilidade para manter a interface anterior
 * enquanto usa o novo sistema de debouncing
 */

import { useSubscriptionSync } from '@/contexts/SubscriptionSyncContext';

/**
 * Hook que mantém a interface anterior (force: boolean) 
 * mas usa o novo sistema de debouncing por baixo
 */
export const useSubscriptionSyncCompat = () => {
  const { syncSubscription: newSync, forceSync, state } = useSubscriptionSync();

  const syncSubscription = async (force = false) => {
    if (force) {
      return forceSync();
    } else {
      return newSync('MANUAL_SYNC');
    }
  };

  return {
    state,
    syncSubscription,
    forceSync,
  };
};