
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard";
import { AddressCard } from "@/components/profile/AddressCard";
import { EmailSettingsCard } from "@/components/profile/EmailSettingsCard";

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
      // Limpar o telefone removendo caracteres não numéricos
      const cleanedPhone = profile.phone ? profile.phone.replace(/\D/g, '') : '';

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          display_name: profile.display_name,
          cpf: profile.cpf,
          birth_date: profile.birth_date,
          crp_number: profile.crp_number,
          nit_nis_pis: profile.nit_nis_pis,
          phone: cleanedPhone,
          phone_country_code: profile.phone_country_code || '+55',
          email_reminders_enabled: profile.email_reminders_enabled,
          // Address fields
          zip_code: profile.zip_code,
          street: profile.street,
          street_number: profile.street_number,
          complement: profile.complement,
          neighborhood: profile.neighborhood,
          city: profile.city,
          state: profile.state,
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
            <ProfileHeader />

            <div className="container mx-auto px-4 py-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <PersonalInfoCard
                  profile={profile}
                  setProfile={setProfile}
                  currentPlan={currentPlan}
                  saving={saving}
                  onSave={handleSave}
                />

                <AddressCard
                  profile={profile}
                  setProfile={setProfile}
                />

                <EmailSettingsCard
                  profile={profile}
                  setProfile={setProfile}
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Profile;
