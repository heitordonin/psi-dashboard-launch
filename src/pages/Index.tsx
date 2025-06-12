
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemsSection } from "@/components/landing/ProblemsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PlansPreviewSection } from "@/components/landing/PlansPreviewSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

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
    <div className="min-h-screen">
      <LandingHeader />
      <HeroSection />
      <ProblemsSection />
      <FeaturesSection />
      <PlansPreviewSection />
      <FAQSection />
      <LandingFooter />
    </div>
  );
};

export default Index;
