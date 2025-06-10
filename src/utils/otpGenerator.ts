
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const formatPhoneForOTP = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Garantir que tenha o código do país +55
  if (cleanPhone.startsWith('55')) {
    return `+${cleanPhone}`;
  } else {
    return `+55${cleanPhone}`;
  }
};
