
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-psiclo-primary via-psiclo-secondary to-psiclo-primary/90 text-white py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                A Plataforma Completa que{" "}
                <span className="text-psiclo-accent">Psicólogos</span>{" "}
                Precisavam
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Gerencie pacientes, cobranças e impostos em um só lugar. 
                Simplifique sua prática profissional e foque no que realmente importa.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-psiclo-accent hover:bg-psiclo-accent/90 text-psiclo-primary font-bold px-8 py-4 text-lg">
                  INICIAR GRÁTIS AGORA
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-psiclo-primary px-8 py-4 text-lg"
              >
                Ver Demonstração
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-psiclo-accent" />
                <span>Versão grátis para iniciar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-psiclo-accent" />
                <span>Sem taxa de setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-psiclo-accent" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
              <img 
                src="/lovable-uploads/efb794fe-cbf8-4517-8bf5-2de04a20f160.png" 
                alt="Psicóloga utilizando o Psiclo" 
                className="w-full h-auto rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
