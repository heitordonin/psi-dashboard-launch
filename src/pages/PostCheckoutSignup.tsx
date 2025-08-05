import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, ArrowRight } from "lucide-react";

const PostCheckoutSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Se usuário já está logado, redirecionar
    if (user) {
      navigate("/dashboard");
      return;
    }

    // Buscar dados da sessão do Stripe dos parâmetros URL
    const sessionIdParam = searchParams.get("session_id");
    const emailParam = searchParams.get("email");
    
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    
    // Se não tem session_id, redirecionar para login
    if (!sessionIdParam) {
      navigate("/login");
    }
  }, [user, searchParams, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, {
        full_name: fullName,
        stripe_session_id: sessionId // Associar a sessão do Stripe
      });

      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta e ativar sua assinatura.",
      });

      // Redirecionar para página de confirmação
      navigate("/email-confirmation");
      
    } catch (error) {
      console.error("Erro no signup:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipSignup = () => {
    // Pular criação de conta e ir direto para login
    navigate(`/login?postCheckout=true&session_id=${sessionId}`);
  };

  if (!sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
          <p className="text-muted-foreground">
            Agora vamos criar sua conta para acessar o sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Escolha uma senha segura"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta e ativar assinatura
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Já tem uma conta?
            </p>
            <Button
              variant="outline"
              onClick={handleSkipSignup}
              className="w-full"
            >
              Fazer login com conta existente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostCheckoutSignup;