/**
 * Helper function for safe parsing of monetary values
 * Handles both string and number inputs consistently
 */
export const safeParseValue = (value: string | number): number => {
  // If it's already a number, return as is
  if (typeof value === 'number') {
    return value;
  }
  
  // If it's a string, check if it needs formatting conversion
  const stringValue = String(value);
  
  // If it contains Brazilian formatting (dots as thousands, comma as decimal)
  if (stringValue.includes(',') || stringValue.includes('.')) {
    // Only do replacement parsing if it contains formatting
    return Number(stringValue.replace(/\./g, "").replace(",", "."));
  }
  
  // Otherwise, just convert to number
  return Number(stringValue);
};

/**
 * Safe parsing specifically for currency inputs that are already numbers
 */
export const safeParseCurrency = (value: string | number): number => {
  if (typeof value === 'number') {
    return value; // CurrencyInput already provides proper number
  }
  
  // Only for legacy string values
  return safeParseValue(value);
};
