import { useMemo } from 'react';

interface ValidationError {
  field: string;
  message: string;
}

interface CourtesyPlanData {
  selectedUser: { id: string; full_name?: string; display_name?: string; email: string } | null;
  planSlug: string;
  expiresAt: string;
  reason: string;
  existingOverrides?: Array<{ user_id: string; is_active: boolean }>;
}

export const useCourtesyPlanValidation = () => {
  const validateCourtesyPlan = useMemo(() => {
    return (data: CourtesyPlanData): ValidationError[] => {
      const errors: ValidationError[] = [];

      // Validação do usuário
      if (!data.selectedUser) {
        errors.push({
          field: 'user',
          message: 'Selecione um usuário válido'
        });
      }

      // Validação do motivo
      if (!data.reason.trim()) {
        errors.push({
          field: 'reason',
          message: 'Digite um motivo para o plano cortesia'
        });
      } else if (data.reason.trim().length < 10) {
        errors.push({
          field: 'reason',
          message: 'Motivo deve ter pelo menos 10 caracteres'
        });
      } else if (data.reason.trim().length > 500) {
        errors.push({
          field: 'reason',
          message: 'Motivo deve ter no máximo 500 caracteres'
        });
      } else {
        // Validar conteúdo do motivo
        const meaningfulTextRegex = /[a-zA-ZÀ-ÿ]{3,}/;
        if (!meaningfulTextRegex.test(data.reason.trim())) {
          errors.push({
            field: 'reason',
            message: 'Motivo deve conter texto descritivo válido'
          });
        }

        // Verificar padrões de spam
        const spamRegex = /(.)\1{4,}/;
        if (spamRegex.test(data.reason.trim())) {
          errors.push({
            field: 'reason',
            message: 'Motivo não pode conter padrões repetitivos'
          });
        }
      }

      // Validação da data de expiração
      if (data.expiresAt) {
        const expiryDate = new Date(data.expiresAt);
        const now = new Date();

        if (isNaN(expiryDate.getTime())) {
          errors.push({
            field: 'expiresAt',
            message: 'Data de expiração inválida'
          });
        } else {
          // Deve ser no futuro (pelo menos 1 hora)
          const minFutureDate = new Date(now.getTime() + 60 * 60 * 1000);
          if (expiryDate <= minFutureDate) {
            errors.push({
              field: 'expiresAt',
              message: 'Data de expiração deve ser pelo menos 1 hora no futuro'
            });
          }

          // Não pode ser mais de 2 anos no futuro
          const maxFutureDate = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
          if (expiryDate > maxFutureDate) {
            errors.push({
              field: 'expiresAt',
              message: 'Data de expiração não pode ser superior a 2 anos'
            });
          }
        }
      }

      // Validação de plano já existente
      if (data.selectedUser && data.existingOverrides) {
        const hasActiveOverride = data.existingOverrides.some(
          override => override.user_id === data.selectedUser!.id && override.is_active
        );
        
        if (hasActiveOverride) {
          errors.push({
            field: 'user',
            message: 'Este usuário já possui um plano cortesia ativo'
          });
        }
      }

      // Validação do slug do plano
      const validPlans = ['gestao', 'psi_regular'];
      if (!validPlans.includes(data.planSlug)) {
        errors.push({
          field: 'planSlug',
          message: 'Plano selecionado inválido'
        });
      }

      return errors;
    };
  }, []);

  const getFieldError = (errors: ValidationError[], field: string): string | null => {
    const error = errors.find(err => err.field === field);
    return error ? error.message : null;
  };

  const hasErrors = (errors: ValidationError[]): boolean => {
    return errors.length > 0;
  };

  return {
    validateCourtesyPlan,
    getFieldError,
    hasErrors
  };
};