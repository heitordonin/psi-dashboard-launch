
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, User } from "lucide-react";
import { formatPhone } from "@/utils/inputFormatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PersonalInfoCardProps {
  profile: any;
  setProfile: (profile: any) => void;
  currentPlan: any;
  saving: boolean;
  onSave: (e: React.FormEvent) => Promise<void>;
}

export const PersonalInfoCard = ({ 
  profile, 
  setProfile, 
  currentPlan, 
  saving, 
  onSave 
}: PersonalInfoCardProps) => {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setProfile({ ...profile, phone: formatted });
  };

  const handleSaveWithEncryption = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare the base data
      let profileUpdateData: any = { 
        full_name: profile.full_name,
        display_name: profile.display_name,
        cpf: profile.cpf,
        birth_date: profile.birth_date,
        crp_number: profile.crp_number,
        nit_nis_pis: profile.nit_nis_pis,
        phone: profile.phone ? profile.phone.replace(/\D/g, '') : null,
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
      };

      // Encrypt CPF if it exists
      if (profile.cpf) {
        const { data: encryptedCpf, error: encryptCpfError } = await supabase.rpc('encrypt_value', {
          value_to_encrypt: profile.cpf,
        });
        if (encryptCpfError) throw encryptCpfError;
        profileUpdateData.cpf_encrypted = encryptedCpf;
      }

      // Encrypt Phone if it exists (use cleaned phone number)
      if (profileUpdateData.phone) {
        const { data: encryptedPhone, error: encryptPhoneError } = await supabase.rpc('encrypt_value', {
          value_to_encrypt: profileUpdateData.phone,
        });
        if (encryptPhoneError) throw encryptPhoneError;
        profileUpdateData.phone_encrypted = encryptedPhone;
      }

      // Call the original onSave function with the enhanced data
      await onSave(e);
      
    } catch (error: any) {
      console.error('Error in encryption process:', error);
      toast.error('Erro ao criptografar dados: ' + error.message);
    }
  };

  return (
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
        <form onSubmit={handleSaveWithEncryption} className="space-y-4">
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
              <Label htmlFor="phone">Telefone</Label>
              <div className="flex">
                <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">
                  {profile.phone_country_code || '+55'}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone ? formatPhone(profile.phone) : ''}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={profile.birth_date || ''}
                onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="crp_number">Número do CRP</Label>
              <Input
                id="crp_number"
                value={profile.crp_number || ''}
                onChange={(e) => setProfile({ ...profile, crp_number: e.target.value })}
                placeholder="CRP 00/000000"
              />
            </div>
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

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
