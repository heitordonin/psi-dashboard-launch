import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWhatsAppLimit } from './useWhatsAppLimit';
import { toast } from 'sonner';

export interface EnhancedWhatsAppMessage {
  to: string;
  message?: string;
  templateSid?: string;
  templateVariables?: Record<string, string>;
  paymentId?: string;
  messageType?: 'text' | 'template' | 'payment_reminder' | 'appointment_reminder' | 'phone_verification' | 'invoice_receipt' | 'system_notification';
  priority?: 'low' | 'normal' | 'high';
  retryCount?: number;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  requestId?: string;
  metrics?: {
    totalLatency: number;
    retryAttempts: number;
  };
  error?: string;
  errorType?: string;
}

export interface SystemHealthMetrics {
  timestamp: string;
  requestId: string;
  messaging: {
    totalMessagesSent24h: number;
    successRate: number;
    failureRate: number;
    avgLatency: number;
  };
  rateLimiting: {
    usersHittingLimit: number;
    avgAttemptsPerUser: number;
  };
  database: {
    avgQueryTime: number;
    connectionHealth: 'healthy' | 'degraded' | 'failed';
  };
  external: {
    twilioHealth: 'healthy' | 'degraded' | 'failed';
    avgTwilioLatency: number;
  };
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
  };
}

export const useEnhancedWhatsApp = () => {
  const { user } = useAuth();
  const { canSend, messagesRemaining, hasWhatsAppAccess, isLoading: limitLoading } = useWhatsAppLimit();

  // Enhanced WhatsApp sending with structured logging and metrics
  const sendWhatsApp = useMutation<WhatsAppResponse, Error, EnhancedWhatsAppMessage>({
    mutationFn: async (messageData: EnhancedWhatsAppMessage) => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      if (!hasWhatsAppAccess) {
        throw new Error('Acesso ao WhatsApp não disponível no seu plano');
      }

      if (!canSend) {
        throw new Error(`Limite de mensagens WhatsApp atingido. Restam ${messagesRemaining} mensagens.`);
      }

      // Client-side logging for debugging
      console.log('[WhatsApp] Sending message', {
        timestamp: new Date().toISOString(),
        userId: user.id,
        messageType: messageData.messageType,
        priority: messageData.priority,
        hasTemplate: !!messageData.templateSid,
        to: messageData.to.replace(/\d{4}$/, '****') // Mask phone for security
      });

      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: messageData
      });

      if (error) {
        console.error('[WhatsApp] Send failed', {
          error: error.message,
          code: error.code,
          details: error.details
        });
        throw new Error(error.message || 'Falha ao enviar mensagem WhatsApp');
      }

      // Log successful response with metrics
      if (data?.metrics) {
        console.log('[WhatsApp] Message sent successfully', {
          messageId: data.messageId,
          status: data.status,
          latency: data.metrics.totalLatency,
          retryAttempts: data.metrics.retryAttempts
        });
      }

      return data as WhatsAppResponse;
    },
    onSuccess: (data) => {
      toast.success('Mensagem WhatsApp enviada com sucesso!', {
        description: data.metrics ? `Enviado em ${data.metrics.totalLatency}ms` : undefined
      });
    },
    onError: (error) => {
      console.error('[WhatsApp] Mutation error', { error: error.message });
      
      // Show user-friendly error messages
      if (error.message.includes('limite')) {
        toast.error('Limite de mensagens atingido', {
          description: 'Atualize seu plano para enviar mais mensagens.'
        });
      } else if (error.message.includes('telefone') || error.message.includes('phone')) {
        toast.error('Número de telefone inválido', {
          description: 'Verifique o formato do número e tente novamente.'
        });
      } else {
        toast.error('Erro ao enviar mensagem', {
          description: error.message
        });
      }
    }
  });

  // System health monitoring
  const systemHealth = useQuery<SystemHealthMetrics>({
    queryKey: ['whatsapp-system-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whatsapp-system-health');
      
      if (error) {
        throw new Error(error.message || 'Falha ao obter status do sistema');
      }
      
      return data as SystemHealthMetrics;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
    enabled: !!user // Only fetch when user is authenticated
  });

  // Enhanced OTP generation with metrics
  const generateOTP = useMutation<any, Error, { phone: string }>({
    mutationFn: async ({ phone }) => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[OTP] Generating code', {
        timestamp: new Date().toISOString(),
        userId: user.id,
        phone: phone.replace(/\d{4}$/, '****')
      });

      const { data, error } = await supabase.functions.invoke('generate-phone-otp', {
        body: { phone }
      });

      if (error) {
        console.error('[OTP] Generation failed', {
          error: error.message,
          code: error.code
        });
        throw new Error(error.message || 'Falha ao gerar código OTP');
      }

      if (data?.metrics) {
        console.log('[OTP] Generated successfully', {
          expiresIn: data.expiresIn,
          totalLatency: data.metrics.totalLatency,
          operations: data.metrics.operations
        });
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Código enviado via WhatsApp!', {
        description: `Expira em ${Math.floor(data.expiresIn / 60)} minutos`
      });
    },
    onError: (error) => {
      console.error('[OTP] Mutation error', { error: error.message });
      
      if (error.message.includes('Muitas tentativas')) {
        toast.error('Muitas tentativas', {
          description: 'Aguarde antes de solicitar um novo código.'
        });
      } else if (error.message.includes('telefone') || error.message.includes('phone')) {
        toast.error('Número inválido', {
          description: 'Verifique o formato do número de telefone.'
        });
      } else {
        toast.error('Erro ao enviar código', {
          description: error.message
        });
      }
    }
  });

  return {
    // Core functionality
    sendWhatsApp,
    generateOTP,
    
    // Limit information
    canSend,
    messagesRemaining,
    hasWhatsAppAccess,
    isLimitLoading: limitLoading,
    
    // System monitoring
    systemHealth: systemHealth.data,
    isSystemHealthLoading: systemHealth.isLoading,
    systemHealthError: systemHealth.error,
    
    // Status
    isSending: sendWhatsApp.isPending,
    isGeneratingOTP: generateOTP.isPending,
    
    // Utilities
    isHealthy: systemHealth.data?.overall.status === 'healthy',
    isDegraded: systemHealth.data?.overall.status === 'degraded',
    isUnhealthy: systemHealth.data?.overall.status === 'unhealthy'
  };
};