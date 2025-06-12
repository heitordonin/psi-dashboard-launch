
import { useEffect } from 'react';

/**
 * Hook for development debugging - only active in development mode
 */
export const useDebugMode = () => {
  const isDev = process.env.NODE_ENV === 'development';

  const log = (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  };

  const error = (...args: any[]) => {
    if (isDev) {
      console.error('[DEBUG ERROR]', ...args);
    }
  };

  const warn = (...args: any[]) => {
    if (isDev) {
      console.warn('[DEBUG WARN]', ...args);
    }
  };

  useEffect(() => {
    if (isDev) {
      console.log('🔧 Debug mode ativo - Psiclo Development');
    }
  }, [isDev]);

  return { log, error, warn, isDev };
};
