import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ModuleSettingsCardProps {
  profile: any;
  setProfile: (profile: any) => void;
}

export const ModuleSettingsCard = ({ profile, setProfile }: ModuleSettingsCardProps) => {
  const handleAgendaToggle = (enabled: boolean) => {
    setProfile({ ...profile, agenda_module_enabled: enabled });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Módulos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="agenda-module">Psiclo Agenda</Label>
            <p className="text-sm text-muted-foreground">
              Habilitar ou desabilitar o módulo de agenda
            </p>
          </div>
          <Switch
            id="agenda-module"
            checked={profile?.agenda_module_enabled ?? true}
            onCheckedChange={handleAgendaToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};