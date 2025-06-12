
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const LandingFooter = () => {
  return (
    <footer className="bg-psiclo-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para Transformar sua Prática?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de psicólogos que já simplificaram sua gestão com o Psiclo.
          </p>
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-psiclo-accent hover:bg-psiclo-accent/90 text-psiclo-primary font-bold px-12 py-4 text-lg"
            >
              COMECE GRÁTIS AGORA
            </Button>
          </Link>
        </div>

        <div className="border-t border-white/20 pt-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <img 
                src="/lovable-uploads/dd8b5b26-acf5-48d0-8293-7f42227c7b84.png" 
                alt="Psiclo" 
                className="h-8 w-auto"
              />
              <p className="text-white/80 text-sm">
                A plataforma completa para gestão de clínicas de psicologia.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><Link to="/plans" className="hover:text-white transition-colors">Planos</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrações</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#contato" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">WhatsApp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/60">
            <p>&copy; 2024 Psiclo. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
