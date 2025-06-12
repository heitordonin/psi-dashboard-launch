
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail } from "lucide-react";

interface EmailSettingsCardProps {
  profile: any;
  setProfile: (profile: any) => void;
}

export const EmailSettingsCard = ({ profile, setProfile }: EmailSettingsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <CardTitle>Configurações de Email</CardTitle>
            <CardDescription>Gerencie suas preferências de notificações por email</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-reminders">Lembretes por Email</Label>
            <p className="text-sm text-muted-foreground">
              Receba lembretes automáticos de pagamentos pendentes
            </p>
          </div>
          <Switch
            id="email-reminders"
            checked={profile.email_reminders_enabled || false}
            onCheckedChange={(checked) => 
              setProfile({ ...profile, email_reminders_enabled: checked })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
