import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";
import { useState } from "react";
import { SubscriptionPlan } from "@/types/subscription";
import { getPlanIcon, getFeatureLabels } from "./PlanUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthenticatedPlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
}

const AuthenticatedPlanCard = ({ plan, isCurrentPlan }: AuthenticatedPlanCardProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();

  const handleStripeCheckout = async () => {
    if (plan.slug === 'free') return;
    
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: { planSlug: plan.slug }
      });

      if (error) throw error;

      if (data?.url) {
        // Abrir checkout do Stripe em nova aba
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Card className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
      {isCurrentPlan && (
        <Badge className="absolute -top-2 left-4 bg-blue-500">
          Plano Atual
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getPlanIcon(plan.slug)}
        </div>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        
        <div className="mt-4">
          <div className="text-3xl font-bold">
            R$ {(plan.price_monthly / 100).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">por mês</div>
          {plan.price_yearly > 0 && (
            <div className="text-sm text-green-600 mt-1">
              ou R$ {(plan.price_yearly / 100).toFixed(2)} por mês (pagamento anual)
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 mb-6">
          {/* Only show patient limit for plans other than Psi Regular */}
          {plan.slug !== 'psi_regular' && (
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm">
                {plan.max_patients ? `Até ${plan.max_patients} pacientes` : 'Pacientes ilimitados'}
              </span>
            </div>
          )}
          
          {getFeatureLabels(plan.features).map((feature, index) => (
            <div key={index} className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {isCurrentPlan ? (
          <Button className="w-full" variant="secondary" disabled>
            Plano Ativo
          </Button>
        ) : (
          <Button 
            className="w-full" 
            variant="default"
            onClick={handleStripeCheckout}
            disabled={isCheckingOut || plan.slug === 'free'}
          >
            {isCheckingOut ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {plan.slug === 'free' ? 'Plano Gratuito' : 'Assinar Plano'}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthenticatedPlanCard;