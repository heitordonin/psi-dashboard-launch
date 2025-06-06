
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-psiclo-primary"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-psiclo-primary via-psiclo-secondary to-psiclo-accent/20 px-4">
      <div className="text-center space-y-8">
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/dd8b5b26-acf5-48d0-8293-7f42227c7b84.png" 
            alt="Psiclo" 
            className="h-20 w-auto"
          />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Bem-vinda ao Psiclo
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            A plataforma completa para psicólogos gerenciarem sua prática profissional
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <Button 
              size="lg" 
              className="bg-white text-psiclo-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-lg"
            >
              Entrar
            </Button>
          </Link>
          <Link to="/signup">
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-psiclo-primary px-8 py-3 text-lg font-semibold shadow-lg"
            >
              Criar Conta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
