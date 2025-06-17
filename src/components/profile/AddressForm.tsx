
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useViaCepLookup } from "@/hooks/useViaCepLookup";
import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

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
  const { lookupCep, isLoading, formatCep, isValidCep } = useViaCepLookup();
  const [cepValue, setCepValue] = useState(formData.zip_code || '');

  const handleCepChange = useCallback(async (value: string) => {
    const formattedCep = formatCep(value);
    setCepValue(formattedCep);
    
    setFormData(prev => ({ ...prev, zip_code: formattedCep }));

    // Se o CEP está válido, fazer a busca
    if (isValidCep(formattedCep)) {
      const addressData = await lookupCep(formattedCep);
      
      if (addressData) {
        setFormData(prev => ({
          ...prev,
          street: addressData.street,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
        }));
      }
    }
  }, [lookupCep, isValidCep, formatCep, setFormData]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="zip_code">CEP</Label>
        <div className="relative">
          <Input
            id="zip_code"
            value={cepValue}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
          )}
        </div>
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
