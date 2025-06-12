
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const LandingHeader = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/dd8b5b26-acf5-48d0-8293-7f42227c7b84.png" 
            alt="Psiclo" 
            className="h-8 w-auto"
          />
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#funcionalidades" className="text-gray-600 hover:text-psiclo-primary transition-colors">
            Funcionalidades
          </a>
          <a href="#planos" className="text-gray-600 hover:text-psiclo-primary transition-colors">
            Planos
          </a>
          <a href="#contato" className="text-gray-600 hover:text-psiclo-primary transition-colors">
            Contato
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <Link to="/login">
            <Button variant="ghost" className="text-gray-600 hover:text-psiclo-primary">
              Entrar
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-psiclo-accent hover:bg-psiclo-accent/90 text-psiclo-primary font-semibold px-6">
              Cadastre-se GRÁTIS
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
