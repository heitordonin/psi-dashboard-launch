
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AddressData {
  zip_code?: string;
  street?: string;
  street_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface AddressFormProps {
  formData: AddressData;
  setFormData: (updater: (prev: AddressData) => AddressData) => void;
}

export const AddressForm = ({ formData, setFormData }: AddressFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="zip_code">CEP</Label>
        <Input
          id="zip_code"
          value={formData.zip_code || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
          placeholder="00000-000"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="street">Rua</Label>
          <Input
            id="street"
            value={formData.street || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
            placeholder="Nome da rua"
          />
        </div>

        <div>
          <Label htmlFor="street_number">Número</Label>
          <Input
            id="street_number"
            value={formData.street_number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, street_number: e.target.value }))}
            placeholder="123"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="complement">Complemento</Label>
        <Input
          id="complement"
          value={formData.complement || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
          placeholder="Apartamento, bloco, etc. (opcional)"
        />
      </div>

      <div>
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input
          id="neighborhood"
          value={formData.neighborhood || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
          placeholder="Nome do bairro"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Nome da cidade"
          />
        </div>

        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={formData.state || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            placeholder="SP"
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );
};
