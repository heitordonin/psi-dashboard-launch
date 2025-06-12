
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { AddressForm } from "@/components/profile/AddressForm";

interface AddressCardProps {
  profile: any;
  setProfile: (profile: any) => void;
}

export const AddressCard = ({ profile, setProfile }: AddressCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MapPin className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <CardTitle>Informações de Endereço</CardTitle>
            <CardDescription>Configure seu endereço completo</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <AddressForm 
          formData={{
            zip_code: profile.zip_code,
            street: profile.street,
            street_number: profile.street_number,
            complement: profile.complement,
            neighborhood: profile.neighborhood,
            city: profile.city,
            state: profile.state,
          }}
          setFormData={(updater) => {
            if (typeof updater === 'function') {
              const newAddressData = updater({
                zip_code: profile.zip_code,
                street: profile.street,
                street_number: profile.street_number,
                complement: profile.complement,
                neighborhood: profile.neighborhood,
                city: profile.city,
                state: profile.state,
              });
              setProfile({ ...profile, ...newAddressData });
            }
          }}
        />
      </CardContent>
    </Card>
  );
};
