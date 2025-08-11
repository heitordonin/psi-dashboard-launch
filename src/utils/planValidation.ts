export const VALID_PLANS = ['gestao', 'psi_regular'] as const;
export type ValidPlan = typeof VALID_PLANS[number];

export const PLAN_INFO = {
  gestao: {
    name: 'Plano Gestão',
    price: 'R$ 49,00/mês',
    description: 'Ideal para psicólogos que querem organizar sua prática'
  },
  psi_regular: {
    name: 'Plano Psi Regular', 
    price: 'R$ 249,00/mês',
    description: 'Para psicólogos que precisam de recursos avançados'
  }
} as const;

export const isValidPlan = (plan: string): plan is ValidPlan => {
  return VALID_PLANS.includes(plan as ValidPlan);
};

export const getPlanInfo = (plan: ValidPlan) => {
  return PLAN_INFO[plan];
};

export interface PlanValidationResult {
  isValid: boolean;
  plan: ValidPlan | null;
  error?: string;
}

export const validatePlanFromUrl = (planParam: string): PlanValidationResult => {
  if (!planParam || typeof planParam !== 'string') {
    return {
      isValid: false,
      plan: null,
      error: 'Parâmetro de plano inválido'
    };
  }

  const trimmedPlan = planParam.trim().toLowerCase();
  
  if (!isValidPlan(trimmedPlan)) {
    return {
      isValid: false,
      plan: null,
      error: `Plano "${planParam}" não existe. Planos disponíveis: ${VALID_PLANS.join(', ')}`
    };
  }

  return {
    isValid: true,
    plan: trimmedPlan,
    error: undefined
  };
};