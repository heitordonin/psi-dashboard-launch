import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ArrowLeft } from "lucide-react";
import { isValidPlan, getPlanInfo } from "@/utils/planValidation";

const DirectCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (!planParam || !isValidPlan(planParam)) {
      toast({
        title: "Plano inválido",
        description: "O plano selecionado não é válido.",
        variant: "destructive",
      });
      navigate("/plans");
      return;
    }
    setPlan(planParam);
  }, [searchParams, navigate, toast]);

  const handleDirectCheckout = async () => {
    if (!plan) return;

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: { 
          planSlug: plan,
          isGuestCheckout: true 
        }
      });

      if (error) {
        console.error("Erro no checkout:", error);
        toast({
          title: "Erro no checkout",
          description: error.message || "Não foi possível iniciar o checkout.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Abrir checkout em nova aba
        window.open(data.url, '_blank');
        
        toast({
          title: "Checkout iniciado",
          description: "O checkout foi aberto em uma nova aba. Complete o pagamento para continuar.",
        });

        // Aguardar alguns segundos e redirecionar para login com instrução
        setTimeout(() => {
          navigate(`/login?postCheckout=true&plan=${plan}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast({
        title: "Erro no checkout",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!plan) {
    return null;
  }

  const planInfo = getPlanInfo(plan as any);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Finalizar Assinatura</CardTitle>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary">{planInfo.name}</h3>
            <p className="text-2xl font-bold">{planInfo.price}</p>
            <p className="text-sm text-muted-foreground">{planInfo.description}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Checkout simplificado:</strong> Complete o pagamento e depois criaremos sua conta automaticamente.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleDirectCheckout}
            disabled={isProcessing}
            className="w-full h-12"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pagar com Stripe
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Já tem uma conta?
            </p>
            <Button
              variant="outline"
              onClick={() => navigate(`/login?plan=${plan}`)}
              className="w-full"
            >
              Fazer login e continuar
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate("/plans")}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos planos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectCheckout;