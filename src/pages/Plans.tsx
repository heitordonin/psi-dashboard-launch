
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscription, useSubscriptionPlans } from "@/hooks/useSubscription";
import { useEffect } from "react";
import PublicPlansView from "@/components/plans/PublicPlansView";
import AuthenticatedPlansView from "@/components/plans/AuthenticatedPlansView";
import PlansLoading from "@/components/plans/PlansLoading";

const Plans = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { currentPlan } = useSubscription();

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
  return <AuthenticatedPlansView plans={plans || []} currentPlan={currentPlan} />;
};

export default Plans;
