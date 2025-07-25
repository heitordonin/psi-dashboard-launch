/**
 * Sistema avançado de debouncing para sincronização de assinatura
 */

interface PendingPromise<T> {
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

interface DebounceConfig {
  delay: number;
  context: string;
  maxWait?: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class SubscriptionDebouncingManager {
  private pendingPromises = new Map<string, PendingPromise<any>[]>();
  private debounceTimeouts = new Map<string, NodeJS.Timeout>();
  private cache = new Map<string, CacheEntry>();
  private lastCall = new Map<string, number>();
  
  // Rate limiting otimizado para sustentabilidade
  private readonly rateLimitWindow = 60 * 1000; // 1 minuto
  private readonly maxCallsPerWindow = 5; // Aumentado para 5 calls por minuto
  private userCalls = new Map<string, number[]>();

  /**
   * Verifica se o usuário atingiu o rate limit
   */
  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userCallsArray = this.userCalls.get(userId) || [];
    
    // Remove chamadas antigas (fora da janela)
    const recentCalls = userCallsArray.filter(callTime => now - callTime < this.rateLimitWindow);
    this.userCalls.set(userId, recentCalls);
    
    return recentCalls.length >= this.maxCallsPerWindow;
  }

  /**
   * Registra uma nova chamada para rate limiting
   */
  private recordCall(userId: string): void {
    const now = Date.now();
    const userCallsArray = this.userCalls.get(userId) || [];
    userCallsArray.push(now);
    this.userCalls.set(userId, userCallsArray);
  }

  /**
   * Verifica se existe dados válidos no cache
   */
  private getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Salva dados no cache
   */
  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Persiste cache crítico no localStorage
   */
  private persistCache(userId: string, data: any, type: 'sync' | 'force'): void {
    try {
      const cacheKey = `subscription-cache-${userId}-${type}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: type === 'force' ? 30 * 1000 : 15 * 60 * 1000 // 30s para force, 15min para sync
      };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`[DEBOUNCING] Cache persistido para ${type} - TTL: ${cacheData.ttl}ms`);
      } catch (error) {
        console.warn('Erro ao persistir cache de assinatura:', error);
      }
  }

  /**
   * Recupera cache persistido do localStorage
   */
  private getPersistedCache(userId: string, type: 'sync' | 'force'): any | null {
    try {
      const cacheKey = `subscription-cache-${userId}-${type}`;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      if (now - cacheData.timestamp > cacheData.ttl) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.warn('Erro ao recuperar cache persistido:', error);
      return null;
    }
  }

  /**
   * Executa função com debouncing avançado
   */
  public async debouncedCall<T>(
    key: string,
    userId: string,
    fn: () => Promise<T>,
    config: DebounceConfig
  ): Promise<T> {
    const { delay, context, maxWait = 5000 } = config;
    const cacheKey = `${key}-${userId}`;
    
    // Verificar cache primeiro
    const cached = this.getCachedData(cacheKey) || this.getPersistedCache(userId, key.includes('force') ? 'force' : 'sync');
    if (cached) {
      console.log(`[DEBOUNCING] Cache hit para ${context}`);
      return Promise.resolve(cached);
    }
    
    // Verificar rate limiting
    if (this.isRateLimited(userId)) {
      console.warn(`[DEBOUNCING] Rate limit atingido para usuário ${userId}`);
      return Promise.reject(new Error('Rate limit exceeded'));
    }

    // Se já existe uma chamada pendente, adicionar à lista de promises
    if (this.pendingPromises.has(key)) {
      console.log(`[DEBOUNCING] Adicionando à promise pendente: ${context}`);
      return new Promise<T>((resolve, reject) => {
        this.pendingPromises.get(key)!.push({ resolve, reject });
      });
    }

    // Criar nova promise pendente
    return new Promise<T>((resolve, reject) => {
      this.pendingPromises.set(key, [{ resolve, reject }]);
      
      // Limpar timeout anterior se existir
      if (this.debounceTimeouts.has(key)) {
        clearTimeout(this.debounceTimeouts.get(key)!);
      }

      const executeCall = async () => {
        const promises = this.pendingPromises.get(key) || [];
        this.pendingPromises.delete(key);
        this.debounceTimeouts.delete(key);
        
        try {
          console.log(`[DEBOUNCING] Executando chamada: ${context}`);
          this.recordCall(userId);
          this.lastCall.set(key, Date.now());
          
          const result = await fn();
          
          // Salvar no cache - TTL otimizado
          const ttl = key.includes('force') ? 30 * 1000 : 15 * 60 * 1000;
          this.setCachedData(cacheKey, result, ttl);
          this.persistCache(userId, result, key.includes('force') ? 'force' : 'sync');
          
          // Resolver todas as promises pendentes
          promises.forEach(({ resolve }) => resolve(result));
          
          return result;
        } catch (error) {
          console.error(`[DEBOUNCING] Erro na chamada: ${context}`, error);
          // Rejeitar todas as promises pendentes
          promises.forEach(({ reject }) => reject(error));
          throw error;
        }
      };

      // Configurar debounce com maxWait
      const timeout = setTimeout(executeCall, delay);
      this.debounceTimeouts.set(key, timeout);
      
      // MaxWait failsafe
      if (maxWait > 0) {
        setTimeout(() => {
          if (this.debounceTimeouts.has(key)) {
            console.log(`[DEBOUNCING] MaxWait atingido para ${context}, executando imediatamente`);
            clearTimeout(this.debounceTimeouts.get(key)!);
            executeCall();
          }
        }, maxWait);
      }
    });
  }

  /**
   * Verifica se uma operação foi executada recentemente
   */
  public wasRecentlyExecuted(key: string, withinMs: number): boolean {
    const lastCallTime = this.lastCall.get(key);
    if (!lastCallTime) return false;
    
    return Date.now() - lastCallTime < withinMs;
  }

  /**
   * Limpa cache e timeouts para um usuário
   */
  public clearUserData(userId: string): void {
    // Limpar cache em memória
    for (const [key, _] of this.cache.entries()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
    
    // Limpar cache persistido
    try {
      localStorage.removeItem(`subscription-cache-${userId}-sync`);
      localStorage.removeItem(`subscription-cache-${userId}-force`);
      localStorage.removeItem(`subscription-last-check-${userId}`);
      localStorage.removeItem(`subscription-focus-check-${userId}`);
    } catch (error) {
      console.warn('Erro ao limpar cache persistido:', error);
    }
    
    // Limpar rate limiting
    this.userCalls.delete(userId);
  }

  /**
   * Força limpeza de cache para sincronização imediata
   */
  public invalidateCache(userId: string, type?: 'sync' | 'force'): void {
    if (type) {
      this.cache.delete(`sync-${userId}`);
      this.cache.delete(`force-${userId}`);
      try {
        localStorage.removeItem(`subscription-cache-${userId}-${type}`);
      } catch (error) {
        console.warn('Erro ao limpar cache específico:', error);
      }
    } else {
      this.clearUserData(userId);
    }
  }
}

// Instância singleton
export const subscriptionDebouncing = new SubscriptionDebouncingManager();

// Configurações de debouncing otimizadas para sustentabilidade
export const DEBOUNCE_CONFIGS = {
  AUTH_LOGIN: { delay: 100, context: 'login', maxWait: 1000 }, // Rápido no login
  AUTH_USER_CHANGE: { delay: 200, context: 'user_change', maxWait: 1500 }, // Rápido na mudança
  AUTO_CHECK: { delay: 1000, context: 'auto_check', maxWait: 3000 }, // Background check
  FOCUS_CHECK: { delay: 3000, context: 'focus_check', maxWait: 6000 }, // Bem lento
  MANUAL_SYNC: { delay: 200, context: 'manual_sync', maxWait: 800 }, // Responsivo para usuário
  FORCE_SYNC: { delay: 0, context: 'force_sync', maxWait: 200 }, // Imediato
  CRITICAL_CHECK: { delay: 0, context: 'critical_check', maxWait: 100 }, // Para operações críticas
} as const;