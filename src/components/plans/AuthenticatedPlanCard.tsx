import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { SubscriptionPlan } from "@/types/subscription";
import { getPlanIcon, getFeatureLabels } from "./PlanUtils";
import { useCancelSubscription } from "@/hooks/useCancelSubscription";
import CancelSubscriptionModal from "./CancelSubscriptionModal";

interface AuthenticatedPlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
}

const AuthenticatedPlanCard = ({ plan, isCurrentPlan }: AuthenticatedPlanCardProps) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const cancelSubscription = useCancelSubscription();

  const handleCancelSubscription = (immediate: boolean) => {
    cancelSubscription.mutate({ immediate });
    setShowCancelModal(false);
  };

  return (
    <>
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        currentPlan={plan}
        isLoading={cancelSubscription.isPending}
      />
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
          <div className="space-y-2">
            <Button className="w-full" variant="secondary" disabled>
              Plano Ativo
            </Button>
            {plan.slug !== 'gratis' && (
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => setShowCancelModal(true)}
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar Plano
              </Button>
            )}
          </div>
        ) : (
          <Button className="w-full" variant="default">
            Escolher Plano
          </Button>
        )}
      </CardContent>
    </Card>
    </>
  );
};

export default AuthenticatedPlanCard;