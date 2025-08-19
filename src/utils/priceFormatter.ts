/**
 * Utilitário centralizado para formatação de preços
 * Garante consistência em toda a aplicação
 */

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
};

export const formatCurrencyWithPeriod = (amount: number, period: string = 'mês'): string => {
  return `${formatCurrency(amount)}/${period}`;
};

export const formatYearlyPrice = (yearlyPrice: number): string => {
  const monthlyYearlyPrice = yearlyPrice / 12;
  return `ou ${formatCurrency(monthlyYearlyPrice)} por mês (pagamento anual)`;
};

/**
 * Para valores do Pagar.me que vêm em centavos
 */
export const formatPagarmeCurrency = (amountInCents: number): string => {
  return formatCurrency(amountInCents / 100);
};

/**
 * Preços conhecidos do sistema para referência
 */
export const PLAN_PRICES = {
  free: 0,
  gestao: 49.00,
  psi_regular: 269.00
} as const;

/**
 * Valida se um preço está correto para um plano específico
 */
export const validatePlanPrice = (planSlug: string, price: number): boolean => {
  if (planSlug in PLAN_PRICES) {
    return PLAN_PRICES[planSlug as keyof typeof PLAN_PRICES] === price;
  }
  return true; // Para planos não conhecidos, assumir que está correto
};