
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/profile/AddressForm";
import { toast } from "sonner";
import { MapPin, Save } from "lucide-react";

interface AddressData {
  zip_code?: string;
  street?: string;
  street_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

const PsicloBankConfiguracao = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AddressData>({});

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Initialize form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        zip_code: profile.zip_code || '',
        street: profile.street || '',
        street_number: profile.street_number || '',
        complement: profile.complement || '',
        neighborhood: profile.neighborhood || '',
        city: profile.city || '',
        state: profile.state || '',
      });
    }
  }, [profile]);

  // Save address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: AddressData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          zip_code: addressData.zip_code,
          street: addressData.street,
          street_number: addressData.street_number,
          complement: addressData.complement,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Endereço salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      console.error('Error saving address:', error);
      toast.error("Erro ao salvar endereço");
    },
  });

  const handleSave = () => {
    saveAddressMutation.mutate(formData);
  };

  if (isLoading || profileLoading) {
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
            <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Configuração do Psiclo Bank</h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>Configure suas informações de endereço para integração bancária</p>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-4 py-8">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>Informações de Endereço</CardTitle>
                        <CardDescription>
                          Configure seu endereço completo para habilitar as funcionalidades do Psiclo Bank
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <AddressForm formData={formData} setFormData={setFormData} />
                    
                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={handleSave} 
                        disabled={saveAddressMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saveAddressMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
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

export default PsicloBankConfiguracao;
