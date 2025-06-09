
export const formatCpf = (value: string) => {
  const numericValue = value.replace(/\D/g, '');
  
  if (numericValue.length <= 11) {
    return numericValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  }
  return value;
};

export const formatCnpj = (value: string) => {
  const numericValue = value.replace(/\D/g, '');
  
  if (numericValue.length <= 14) {
    return numericValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2');
  }
  return value;
};

export const formatPhone = (value: string) => {
  const numericValue = value.replace(/\D/g, '');
  
  if (numericValue.length <= 11) {
    return numericValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  return value;
};
