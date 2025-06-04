
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Users, CreditCard, Receipt } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import LogoutButton from "@/components/LogoutButton";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <CreditCard className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold">Cobranças</h2>
              </div>
              <p className="text-gray-600 mb-4">Gerencie cobranças e pagamentos</p>
              <Button onClick={() => navigate('/cobrancas')} className="w-full">
                Acessar Cobranças
              </Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <Receipt className="w-8 h-8 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold">Despesas</h2>
              </div>
              <p className="text-gray-600 mb-4">Gerencie despesas do consultório</p>
              <Button onClick={() => navigate('/despesas')} className="w-full">
                Acessar Despesas
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
