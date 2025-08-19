import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageSquare } from "lucide-react";
import { useWhatsAppLimit } from "@/hooks/useWhatsAppLimit";

export const WhatsAppLimitCard = () => {
  const { 
    messagesUsed, 
    totalAllowed, 
    messagesRemaining, 
    isLoading,
    hasWhatsAppAccess,
    planSlug
  } = useWhatsAppLimit();

  // Só mostrar para usuários do plano Gestão
  if (!hasWhatsAppAccess || planSlug !== 'gestao') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">WhatsApp</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = totalAllowed > 0 ? (messagesUsed / totalAllowed) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">WhatsApp</CardTitle>
        </div>
        <CardDescription>
          Controle de mensagens do plano Gestão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {messagesUsed} de {totalAllowed} mensagens utilizadas este mês
            </span>
            <span className={`font-medium ${messagesRemaining <= 10 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {messagesRemaining} restantes
            </span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className="w-full h-2"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0</span>
            <span>{totalAllowed}</span>
          </div>
        </div>

        {messagesRemaining <= 10 && messagesRemaining > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Você está próximo do limite mensal de mensagens WhatsApp.
            </p>
          </div>
        )}

        {messagesRemaining === 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Limite atingido:</strong> Você utilizou todas as mensagens WhatsApp disponíveis neste mês.
            </p>
            <p className="text-xs text-red-700 mt-1">
              O limite será renovado no próximo mês ou você pode fazer upgrade para o plano Psi Regular.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};