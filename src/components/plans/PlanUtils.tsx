import { Crown, Star, Zap } from "lucide-react";

export const getPlanIcon = (slug: string) => {
  switch (slug) {
    case 'gratis':
      return <Star className="w-6 h-6" />;
    case 'gestao':
      return <Zap className="w-6 h-6" />;
    case 'psi_regular':
      return <Crown className="w-6 h-6" />;
    default:
      return <Star className="w-6 h-6" />;
  }
};

export const getFeatureLabels = (features: string[]) => {
  const featureMap: Record<string, string> = {
    // Plano Grátis features
    unlimited_invoices: 'Cobranças ilimitadas',
    basic_dashboard: 'Dashboard básico',
    email_support: 'Suporte por chamado',
    email_notifications: 'Notificações por email',
    
    // Plano Gestão features  
    whatsapp_reminders: 'Lembretes de cobranças por WhatsApp',
    
    // Plano Psi Regular features
    whatsapp_support: 'Tudo do plano Gestão +',
    receita_saude_receipts: 'Nós lançamos o seu Receita Saúde',
    monthly_darf: 'Nós emitimos o seu DARF mensal',
    carne_leao_tracking: 'Nós lançamos as suas despesas no Carnê Leão'
  };

  return features.map(feature => featureMap[feature] || feature);
};