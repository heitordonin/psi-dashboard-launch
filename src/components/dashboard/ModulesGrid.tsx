
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleTile } from "./ModuleTile";
import { ReceitaSaudeTile } from "./ReceitaSaudeTile";
import { Users, CreditCard, Receipt } from "lucide-react";

export const ModulesGrid = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulos do Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModuleTile
            icon={Users}
            color="indigo"
            label="Pacientes"
            to="/patients"
          />
          <ModuleTile
            icon={CreditCard}
            color="green"
            label="Cobranças"
            to="/payments"
          />
          <ModuleTile
            icon={Receipt}
            color="purple"
            label="Despesas"
            to="/expenses"
          />
          <ReceitaSaudeTile />
        </div>
      </CardContent>
    </Card>
  );
};
