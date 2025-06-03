
import { SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    // This will be handled by the SignedIn component
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <SignedOut>
          <h1 className="text-4xl font-bold mb-8">Bem-vinda ao Declara Psi</h1>
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <Button size="lg">Entrar</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          {navigate("/dashboard")}
        </SignedIn>
      </div>
    </div>
  );
};

export default Index;
