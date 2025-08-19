import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscription } from "./useSubscription";

interface WhatsAppLimitInfo {
  canSend: boolean;
  messagesUsed: number;
  messagesRemaining: number;
  totalAllowed: number;
  isUnlimited: boolean;
  hasWhatsAppAccess: boolean;
}

export const useWhatsAppLimit = () => {
  const { user } = useAuth();
  const { currentPlan, hasFeature } = useSubscription();

  const { data: monthlyCount, isLoading } = useQuery({
    queryKey: ['monthly-whatsapp-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .rpc('get_monthly_whatsapp_count', { p_user_id: user.id });
      
      if (error) {
        console.error('Error fetching monthly WhatsApp count:', error);
        return 0;
      }
      
      return data as number;
    },
    enabled: !!user?.id
  });

  const getLimitInfo = (): WhatsAppLimitInfo => {
    const messagesUsed = monthlyCount || 0;
    
    // Verificar se tem acesso ao WhatsApp baseado nas features do plano
    const hasUnlimitedWhatsApp = hasFeature('unlimited_whatsapp');
    const hasLimitedWhatsApp = hasFeature('whatsapp_limit_100');
    const hasWhatsAppAccess = hasUnlimitedWhatsApp || hasLimitedWhatsApp;
    
    if (!hasWhatsAppAccess) {
      return {
        canSend: false,
        messagesUsed: 0,
        messagesRemaining: 0,
        totalAllowed: 0,
        isUnlimited: false,
        hasWhatsAppAccess: false
      };
    }

    if (hasUnlimitedWhatsApp) {
      return {
        canSend: true,
        messagesUsed,
        messagesRemaining: Infinity,
        totalAllowed: Infinity,
        isUnlimited: true,
        hasWhatsAppAccess: true
      };
    }

    // Plano Gestão: limite de 100 mensagens por mês
    const MONTHLY_LIMIT = 100;
    const messagesRemaining = Math.max(0, MONTHLY_LIMIT - messagesUsed);
    const canSend = messagesRemaining > 0;

    return {
      canSend,
      messagesUsed,
      messagesRemaining,
      totalAllowed: MONTHLY_LIMIT,
      isUnlimited: false,
      hasWhatsAppAccess: true
    };
  };

  const limitInfo = getLimitInfo();

  return {
    ...limitInfo,
    isLoading,
    planSlug: currentPlan?.slug
  };
};