
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceDescription {
  id: string;
  text: string;
}

interface DescriptionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const DescriptionAutocomplete = ({ value, onChange, error }: DescriptionAutocompleteProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<InvoiceDescription[]>([]);

  const { data: descriptions = [], isError } = useQuery({
    queryKey: ['invoice-descriptions'],
    queryFn: async () => {
      console.log('Buscando descrições padrão...');
      const { data, error } = await supabase
        .from('invoice_descriptions')
        .select('*')
        .order('text');
      if (error) {
        console.error('Erro ao buscar descrições:', error);
        throw error;
      }
      console.log('Descrições encontradas:', data);
      return data as InvoiceDescription[];
    }
  });

  useEffect(() => {
    if (value.length > 0) {
      const filtered = descriptions.filter(desc =>
        desc.text.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      // Mostrar todas as descrições quando o campo estiver vazio
      setFilteredSuggestions(descriptions);
    }
  }, [value, descriptions]);

  const handleSelectSuggestion = (suggestion: InvoiceDescription) => {
    console.log('Selecionando sugestão:', suggestion.text);
    onChange(suggestion.text);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Só esconde as sugestões se o foco não foi para uma sugestão
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('[data-suggestions-container]')) {
      setTimeout(() => setShowSuggestions(false), 100);
    }
  };

  return (
    <div className="relative">
      <Label htmlFor="description">Descrição *</Label>
      <Input
        id="description"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="Digite ou selecione uma descrição"
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {isError && <p className="text-amber-600 text-sm mt-1">Erro ao carregar sugestões</p>}
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          data-suggestions-container
          className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="w-full px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm text-left"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
