import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { SubscriptionHealthDashboard } from '@/components/subscription/SubscriptionHealthDashboard';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SubscriptionMonitoring = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                    Monitoramento de Assinaturas
                  </h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>
                    Dashboard de saúde do sistema de assinaturas
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                className="text-white hover:text-gray-200 hover:bg-white/10"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            <SubscriptionHealthDashboard />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SubscriptionMonitoring;