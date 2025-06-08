import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Crown } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { currentPlan } = useSubscription();
  const [profile, setProfile] = useState({
    full_name: "",
    cpf: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          cpf: data.cpf || "",
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          cpf: profile.cpf,
        });

      if (error) {
        toast.error('Erro ao atualizar perfil');
        console.error('Error updating profile:', error);
      } else {
        toast.success('Perfil atualizado com sucesso!');
        navigate('/dashboard'); // Navigate to dashboard after successful save
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/plans');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Perfil</h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>Gerencie suas informações pessoais</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={profile.cpf}
                        onChange={(e) => setProfile({ ...profile, cpf: e.target.value })}
                        placeholder="Digite seu CPF"
                      />
                    </div>
                    <Button 
                      onClick={handleSave} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Subscription Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Plano Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <h3 className="text-2xl font-bold text-primary">
                        {currentPlan?.name || 'Freemium'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentPlan?.description || 'Plano gratuito com funcionalidades básicas'}
                      </p>
                    </div>
                    
                    {currentPlan?.price && (
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          R$ {currentPlan.price.toFixed(2)}/mês
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={handleUpgrade}
                      variant="outline"
                      className="w-full"
                    >
                      {currentPlan?.name === 'Freemium' ? 'Fazer Upgrade' : 'Alterar Plano'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Profile;
