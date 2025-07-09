
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickTile } from "./QuickTile";
import { UserPlus, Plus, DollarSign, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export const QuickActions = () => {
  const navigate = useNavigate();
  const { currentPlan } = useSubscription();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <QuickTile
              icon={UserPlus}
              label="Novo Paciente"
              onClick={() => navigate("/patients")}
            />
            <QuickTile
              icon={Plus}
              label="Nova Cobrança"
              onClick={() => navigate("/payments")}
            />
            <QuickTile
              icon={DollarSign}
              label="Nova Despesa"
              onClick={() => navigate("/expenses")}
            />
            {currentPlan?.slug === 'psi_regular' && (
              <QuickTile
                icon={FolderOpen}
                label="Documentos Recebidos"
                onClick={() => navigate("/documentos-recebidos")}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
