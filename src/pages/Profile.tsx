
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Crown, User, Mail } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { currentPlan } = useSubscription();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          display_name: profile.display_name,
          cpf: profile.cpf,
          birth_date: profile.birth_date,
          crp_number: profile.crp_number,
          nit_nis_pis: profile.nit_nis_pis,
          email_reminders_enabled: profile.email_reminders_enabled
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Perfil</h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>Gerencie suas informações pessoais</p>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-4 py-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle>Informações do Perfil</CardTitle>
                          <CardDescription>Atualize seus dados pessoais e profissionais</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <Badge variant="secondary">{currentPlan?.name || 'Freemium'}</Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="full_name">Nome Completo</Label>
                          <Input
                            id="full_name"
                            value={profile.full_name || ''}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            placeholder="Seu nome completo"
                          />
                        </div>

                        <div>
                          <Label htmlFor="display_name">Nome de Exibição</Label>
                          <Input
                            id="display_name"
                            value={profile.display_name || ''}
                            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                            placeholder="Como você quer ser chamado"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cpf">CPF</Label>
                          <Input
                            id="cpf"
                            value={profile.cpf || ''}
                            onChange={(e) => setProfile({ ...profile, cpf: e.target.value })}
                            placeholder="000.000.000-00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="birth_date">Data de Nascimento</Label>
                          <Input
                            id="birth_date"
                            type="date"
                            value={profile.birth_date || ''}
                            onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="crp_number">Número do CRP</Label>
                          <Input
                            id="crp_number"
                            value={profile.crp_number || ''}
                            onChange={(e) => setProfile({ ...profile, crp_number: e.target.value })}
                            placeholder="CRP 00/000000"
                          />
                        </div>

                        <div>
                          <Label htmlFor="nit_nis_pis">NIT/NIS/PIS</Label>
                          <Input
                            id="nit_nis_pis"
                            value={profile.nit_nis_pis || ''}
                            onChange={(e) => setProfile({ ...profile, nit_nis_pis: e.target.value })}
                            placeholder="000.00000.00-0"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving}>
                          {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Mail className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle>Configurações de Email</CardTitle>
                        <CardDescription>Gerencie suas preferências de notificações por email</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-reminders">Lembretes por Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba lembretes automáticos de pagamentos pendentes
                        </p>
                      </div>
                      <Switch
                        id="email-reminders"
                        checked={profile.email_reminders_enabled || false}
                        onCheckedChange={(checked) => 
                          setProfile({ ...profile, email_reminders_enabled: checked })
                        }
                      />
                    </div>
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
