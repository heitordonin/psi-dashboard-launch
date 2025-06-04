
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface GuardianToggleProps {
  hasGuardian: boolean;
  setHasGuardian: (value: boolean) => void;
}

export const GuardianToggle = ({ hasGuardian, setHasGuardian }: GuardianToggleProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="has-guardian"
        checked={hasGuardian}
        onCheckedChange={setHasGuardian}
      />
      <Label htmlFor="has-guardian">Tem responsável financeiro?</Label>
    </div>
  );
};
