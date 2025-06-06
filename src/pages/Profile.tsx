
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User } from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";

interface ProfileData {
  full_name: string;
  cpf: string;
  birth_date: string;
  display_name: string;
  crp_number: string;
  nit_nis_pis: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    cpf: "",
    birth_date: "",
    display_name: "",
    crp_number: "",
    nit_nis_pis: "",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, cpf, birth_date, display_name, crp_number, nit_nis_pis')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          toast.error('Erro ao carregar perfil');
          return;
        }

        if (data) {
          setFormData({
            full_name: data.full_name || "",
            cpf: data.cpf || "",
            birth_date: data.birth_date || "",
            display_name: data.display_name || "",
            crp_number: data.crp_number || "",
            nit_nis_pis: data.nit_nis_pis || "",
          });
        }
      } catch (error) {
        console.error('Error in loadProfile:', error);
        toast.error('Erro ao carregar perfil');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const formatCPF = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 11) {
      return numericValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      setFormData(prev => ({
        ...prev,
        [name]: formatCPF(value)
      }));
    } else if (name === 'full_name') {
      // Auto-update display_name when full_name changes
      const displayName = value.trim().split(' ')[0];
      setFormData(prev => ({
        ...prev,
        full_name: value,
        display_name: displayName
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        full_name: formData.full_name.trim() || null,
        cpf: formData.cpf.replace(/\D/g, '') || null,
        birth_date: formData.birth_date || null,
        display_name: formData.display_name.trim() || null,
        crp_number: formData.crp_number.trim() || null,
        nit_nis_pis: formData.nit_nis_pis.trim() || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        if (error.message.includes('duplicate key value violates unique constraint "unique_cpf"')) {
          toast.error('Este CPF já está cadastrado por outro usuário');
        } else {
          toast.error('Erro ao atualizar perfil: ' + error.message);
        }
        return;
      }

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Erro inesperado ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingProfile) {
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
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Perfil</h1>
                  <p className="text-sm text-gray-600">Gerencie suas informações pessoais</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        O e-mail não pode ser alterado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="Digite seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_name">Nome de Exibição</Label>
                      <Input
                        id="display_name"
                        name="display_name"
                        type="text"
                        value={formData.display_name}
                        onChange={handleInputChange}
                        placeholder="Como você quer ser chamado"
                      />
                      <p className="text-xs text-gray-500">
                        Atualizado automaticamente com base no primeiro nome
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        name="cpf"
                        type="text"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Data de Nascimento</Label>
                      <Input
                        id="birth_date"
                        name="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nit_nis_pis">Número NIT/NIS/PIS</Label>
                      <Input
                        id="nit_nis_pis"
                        name="nit_nis_pis"
                        type="text"
                        value={formData.nit_nis_pis}
                        onChange={handleInputChange}
                        placeholder="Digite seu NIT/NIS/PIS"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="crp_number">Registro no CRP</Label>
                      <Input
                        id="crp_number"
                        name="crp_number"
                        type="text"
                        value={formData.crp_number}
                        onChange={handleInputChange}
                        placeholder="CRP 00/00000"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Profile;
