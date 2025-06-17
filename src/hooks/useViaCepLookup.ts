
import { useState } from 'react';
import { toast } from 'sonner';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const useViaCepLookup = () => {
  const [isLoading, setIsLoading] = useState(false);

  const formatCep = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 5) {
      return cleanValue;
    }
    return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
  };

  const isValidCep = (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8;
  };

  const lookupCep = async (cep: string): Promise<AddressData | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (!isValidCep(cep)) {
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro na consulta do CEP');
      }

      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return null;
      }

      toast.success('Endereço encontrado!');
      
      return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP. Tente novamente.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    lookupCep,
    isLoading,
    formatCep,
    isValidCep,
  };
};
