import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { ValidPlan, getPlanInfo } from '@/utils/planValidation';

interface PlanSelectionBannerProps {
  selectedPlan: ValidPlan;
}

export const PlanSelectionBanner = ({ selectedPlan }: PlanSelectionBannerProps) => {
  const planInfo = getPlanInfo(selectedPlan);

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
            <Check className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground">Plano Selecionado:</span>
              <Badge variant="secondary">{planInfo.name}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{planInfo.price}</span>
              <span>•</span>
              <span>{planInfo.description}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};