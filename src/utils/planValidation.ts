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
    price: 'R$ 129,00/mês',
    description: 'Para psicólogos que precisam de recursos avançados'
  }
} as const;

export const isValidPlan = (plan: string): plan is ValidPlan => {
  return VALID_PLANS.includes(plan as ValidPlan);
};

export const getPlanInfo = (plan: ValidPlan) => {
  return PLAN_INFO[plan];
};