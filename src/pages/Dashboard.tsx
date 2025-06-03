
import { SignedIn, SignedOut, SignOutButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Users } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Bem-vindo ao sistema de gerenciamento</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center mb-4">
                  <Users className="w-8 h-8 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Pacientes</h2>
                </div>
                <p className="text-gray-600 mb-4">Gerencie informações dos pacientes</p>
                <Button onClick={() => navigate('/patients')} className="w-full">
                  Acessar Pacientes
                </Button>
              </div>
            </div>
            
            <div className="text-center">
              <SignOutButton>
                <Button variant="outline" size="lg">Sair</Button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToHome />
      </SignedOut>
    </div>
  );
};

const RedirectToHome = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return null;
};

export default Dashboard;
