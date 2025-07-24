import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);

  useEffect(() => {
    const verifySubscription = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        console.log("Verificando assinatura após checkout...");
        
        const { data, error } = await supabase.functions.invoke('check-stripe-subscription');
        
        if (error) {
          console.error("Erro ao verificar assinatura:", error);
          toast({
            title: "Erro na verificação",
            description: "Não foi possível verificar sua assinatura. Tente novamente em alguns minutos.",
            variant: "destructive",
          });
        } else {
          console.log("Verificação concluída:", data);
          
          if (data.subscribed) {
            toast({
              title: "Assinatura confirmada!",
              description: `Seu plano ${data.subscription_tier} está ativo.`,
            });
          } else {
            toast({
              title: "Aguardando confirmação",
              description: "Sua assinatura ainda está sendo processada. Isso pode levar alguns minutos.",
              variant: "default",
            });
          }
        }
      } catch (error) {
        console.error("Erro na verificação da assinatura:", error);
        toast({
          title: "Erro na verificação",
          description: "Ocorreu um erro ao verificar sua assinatura.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
        setVerificationComplete(true);
        
        // Aguarda 3 segundos antes de redirecionar
        setTimeout(() => {
          navigate("/plans");
        }, 3000);
      }
    };

    // Verifica se chegou do checkout do Stripe
    if (searchParams.get("success") !== null || window.location.pathname === "/checkout/success") {
      verifySubscription();
    } else {
      // Se não veio do checkout, redireciona para plans
      navigate("/plans");
    }
  }, [user, navigate, searchParams, toast]);

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="container mx-auto p-6 max-w-2xl">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4">
                  {isVerifying ? (
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  ) : (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {isVerifying ? "Verificando sua assinatura..." : "Checkout realizado com sucesso!"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isVerifying ? (
                  <p className="text-muted-foreground">
                    Estamos verificando o status da sua assinatura no Stripe.
                    Isso pode levar alguns segundos...
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Sua assinatura foi processada com sucesso. 
                      Você será redirecionado para a página de planos em alguns segundos.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => navigate("/plans")}>
                        Ir para Planos
                      </Button>
                      <Button variant="outline" onClick={() => navigate("/dashboard")}>
                        Ir para Dashboard
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CheckoutSuccess;