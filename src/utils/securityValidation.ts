
/**
 * Security validation utilities for the Psiclo application
 */

// CPF validation with enhanced security considerations
export const validateCPF = (cpf: string): boolean => {
  if (!cpf || typeof cpf !== 'string') return false;
  
  // Remove any non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if CPF has exactly 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Additional security: Check for minimum and maximum valid ranges
  const cpfNumber = parseInt(cleanCPF);
  if (cpfNumber < 10000000000 || cpfNumber > 99999999999) return false;
  
  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Enhanced security: Check for sequential numbers
  let isSequential = true;
  for (let i = 1; i < cleanCPF.length; i++) {
    if (parseInt(cleanCPF[i]) !== parseInt(cleanCPF[i-1]) + 1) {
      isSequential = false;
      break;
    }
  }
  if (isSequential) return false;
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

// CNPJ validation with security considerations
export const validateCNPJ = (cnpj: string): boolean => {
  if (!cnpj || typeof cnpj !== 'string') return false;
  
  // Remove any non-digit characters
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Check if CNPJ has exactly 14 digits
  if (cleanCNPJ.length !== 14) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
  
  return true;
};

// Secure phone validation
export const validatePhoneNumber = (phone: string, countryCode: string = '+55'): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // For Brazilian numbers (+55)
  if (countryCode === '+55') {
    // Must have 10 or 11 digits (with area code)
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;
    
    // Area code validation (11-99)
    const areaCode = cleanPhone.substring(0, 2);
    const areaCodeNum = parseInt(areaCode);
    if (areaCodeNum < 11 || areaCodeNum > 99) return false;
    
    // Mobile numbers must start with 9 and have 11 digits total
    if (cleanPhone.length === 11) {
      const thirdDigit = cleanPhone.charAt(2);
      if (thirdDigit !== '9') return false;
    }
    
    return true;
  }
  
  // For other countries, basic length validation
  return cleanPhone.length >= 8 && cleanPhone.length <= 15;
};

// Secure email validation
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email regex that prevents common injection patterns
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Additional security checks
  if (email.length > 320) return false; // RFC 5321 limit
  if (email.includes('..')) return false; // Consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false;
  
  return emailRegex.test(email);
};

// Input sanitization for text fields
export const sanitizeTextInput = (input: string, maxLength: number = 255): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential XSS characters
};

// Validate monetary amounts
export const validateAmount = (amount: number | string): boolean => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount.replace(/[^\d.-]/g, ''));
  }
  
  if (isNaN(amount) || !isFinite(amount)) return false;
  if (amount < 0) return false;
  if (amount > 999999999.99) return false; // Reasonable upper limit
  
  return true;
};

// Rate limiting helper for client-side
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return (key: string): boolean => {
    const now = Date.now();
    const record = attempts.get(key);
    
    if (!record || now > record.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  };
};

// Create rate limiter for patient invites (max 5 per hour per user)
export const patientInviteRateLimiter = createRateLimiter(5, 60 * 60 * 1000);
