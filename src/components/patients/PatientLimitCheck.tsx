
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Crown, AlertTriangle } from "lucide-react";

export const PatientLimitCheck = () => {
  const { user } = useAuth();
  const { patientLimit, currentPlan } = useSubscription();
  const navigate = useNavigate();

  const { data: patientCount = 0 } = useQuery({
    queryKey: ['patients-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id
  });

  const isAtLimit = patientLimit !== null && patientCount >= patientLimit;
  const isNearLimit = patientLimit !== null && patientCount >= (patientLimit * 0.8);

  if (!patientLimit || patientLimit === null) {
    return null; // Unlimited plan
  }

  if (isAtLimit) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-red-800">
            Você atingiu o limite de {patientLimit} pacientes do plano {currentPlan?.name}.
          </span>
          <Button
            size="sm"
            onClick={() => navigate("/plans")}
            className="ml-4"
          >
            <Crown className="w-4 h-4 mr-1" />
            Fazer Upgrade
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isNearLimit) {
    return (
      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-800">
            Você está usando {patientCount} de {patientLimit} pacientes disponíveis.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/plans")}
          >
            Ver Planos
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
