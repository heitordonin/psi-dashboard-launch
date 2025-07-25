
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscription, useSubscriptionPlans } from "@/hooks/useSubscription";
import { useEffect } from "react";
import PublicPlansView from "@/components/plans/PublicPlansView";
import AuthenticatedPlansView from "@/components/plans/AuthenticatedPlansView";
import PlansLoading from "@/components/plans/PlansLoading";
import { useAutoSubscriptionCheck } from "@/hooks/useAutoSubscriptionCheck";
import { useForceSyncSubscription } from "@/hooks/useForceSyncSubscription";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const Plans = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { currentPlan } = useSubscription();
  const forceSyncMutation = useForceSyncSubscription();
  
  // Auto-verificação da assinatura
  useAutoSubscriptionCheck();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  // Se não há usuário logado, mostrar página pública de planos
  if (!user && !isLoading) {
    return <PublicPlansView />;
  }

  if (isLoading || plansLoading) {
    return <PlansLoading />;
  }

  // Usuário logado - interface administrativa
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => forceSyncMutation.mutate()}
          disabled={forceSyncMutation.isPending}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${forceSyncMutation.isPending ? 'animate-spin' : ''}`} />
          {forceSyncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Plano'}
        </Button>
      </div>
      <AuthenticatedPlansView plans={plans || []} currentPlan={currentPlan} />
    </div>
  );
};

export default Plans;
