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
    unlimited_invoices: 'Cobranças ilimitadas',
    basic_dashboard: 'Dashboard básico',
    email_support: 'Suporte por chamado',
    whatsapp_reminders: 'Lembretes de cobranças via WhatsApp',
    whatsapp_support: 'Suporte via WhatsApp',
    receita_saude_receipts: 'Nós emitimos o Receita Saúde pra você',
    monthly_darf: 'Nós emitimos o seu DARF do carnê leão mensal',
    carne_leao_tracking: 'Nunca mais se preocupe com o Carnê Leão'
  };

  return features.map(feature => featureMap[feature] || feature);
};