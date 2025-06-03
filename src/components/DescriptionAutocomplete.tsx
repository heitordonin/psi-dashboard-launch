
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

  const { data: descriptions = [] } = useQuery({
    queryKey: ['invoice-descriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_descriptions')
        .select('*')
        .order('text');
      if (error) throw error;
      return data as InvoiceDescription[];
    }
  });

  useEffect(() => {
    if (value.length > 0) {
      const filtered = descriptions.filter(desc =>
        desc.text.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, descriptions]);

  const handleSelectSuggestion = (suggestion: InvoiceDescription) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (value.length > 0 && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => setShowSuggestions(false), 200);
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
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
              onMouseDown={() => handleSelectSuggestion(suggestion)}
            >
              {suggestion.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
