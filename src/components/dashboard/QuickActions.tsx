
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickTile } from "./QuickTile";
import { UserPlus, Plus, DollarSign, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useUnviewedDocuments } from "@/hooks/useUnviewedDocuments";

export const QuickActions = () => {
  const navigate = useNavigate();
  const { currentPlan } = useSubscription();
  const { hasUnviewedDocuments } = useUnviewedDocuments();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="mobile-spacing">
        <div className="flex justify-center">
          <div className="interactive-grid grid-cols-2 md:flex md:gap-3 overflow-x-auto pb-2 w-full">
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
                showNotification={hasUnviewedDocuments}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
