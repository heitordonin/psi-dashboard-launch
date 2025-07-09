import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { SubscriptionPlan } from "@/types/subscription";
import { getPlanIcon, getFeatureLabels } from "./PlanUtils";

interface AuthenticatedPlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
}

const AuthenticatedPlanCard = ({ plan, isCurrentPlan }: AuthenticatedPlanCardProps) => {
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
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm">
              {plan.max_patients ? `Até ${plan.max_patients} pacientes` : 'Pacientes ilimitados'}
            </span>
          </div>
          
          {getFeatureLabels(plan.features).map((feature, index) => (
            <div key={index} className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "secondary" : "default"}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? 'Plano Ativo' : 'Escolher Plano'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthenticatedPlanCard;