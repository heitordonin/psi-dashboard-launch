
import { useState } from 'react';

export const useCurrencyInput = (initialValue: string | number = '') => {
  const [value, setValue] = useState(() => {
    if (typeof initialValue === 'number') {
      return formatCurrency(initialValue);
    }
    return initialValue.toString();
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value: string) => {
    // Remove tudo exceto números e vírgula
    const cleaned = value.replace(/[^\d,]/g, '');
    // Substitui vírgula por ponto para conversão
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const handleChange = (inputValue: string) => {
    // Remove caracteres não numéricos exceto vírgula
    let cleaned = inputValue.replace(/[^\d,]/g, '');
    
    // Garante apenas uma vírgula
    const commaCount = (cleaned.match(/,/g) || []).length;
    if (commaCount > 1) {
      const lastCommaIndex = cleaned.lastIndexOf(',');
      cleaned = cleaned.substring(0, lastCommaIndex) + cleaned.substring(lastCommaIndex + 1);
    }

    // Limita a 2 casas decimais após a vírgula
    const parts = cleaned.split(',');
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      cleaned = parts.join(',');
    }

    // Adiciona pontos como separadores de milhares
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      cleaned = parts.join(',');
    }

    setValue(cleaned);
  };

  const getNumericValue = () => {
    return parseCurrency(value);
  };

  return {
    value,
    handleChange,
    getNumericValue,
    setValue: (newValue: string | number) => {
      if (typeof newValue === 'number') {
        setValue(formatCurrency(newValue));
      } else {
        setValue(newValue);
      }
    }
  };
};
