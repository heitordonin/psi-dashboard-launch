// Validações específicas para regras da Receita Saúde

/**
 * Valida se uma data retroativa está dentro do limite legal da Receita Saúde
 * A regra: não pode registrar cobrança/pagamento retroativo após o dia 10 do mês subsequente
 * 
 * @param retroactiveDate - Data retroativa (vencimento ou pagamento)
 * @param currentDate - Data atual (opcional, usa hoje se não fornecida)
 * @returns { isValid: boolean, errorMessage?: string }
 */
export function validateReceitaSaudeDate(retroactiveDate: string, currentDate?: Date) {
  const targetDate = new Date(retroactiveDate + 'T00:00:00');
  const today = currentDate || new Date();
  
  // Normalizar as datas para remover componente de tempo
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  console.log('🔍 Validação Receita Saúde:', {
    retroactiveDate,
    targetDate: targetDate.toISOString(),
    today: today.toISOString(),
    isRetroactive: targetDate < today
  });
  
  // Se a data não é retroativa, não precisa validar
  if (targetDate >= today) {
    console.log('✅ Data não é retroativa, validação OK');
    return { isValid: true };
  }
  
  // Regra da Receita Saúde: após o dia 10 do mês atual, 
  // não pode registrar datas retroativas do mês anterior
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();
  
  // Calcular a diferença em meses
  const monthsDifference = (currentYear - targetYear) * 12 + (currentMonth - targetMonth);
  
  console.log('📅 Análise temporal:', {
    currentDay,
    monthsDifference,
    targetMonth: targetMonth + 1, // +1 para exibir mês humano
    currentMonth: currentMonth + 1 // +1 para exibir mês humano
  });
  
  // Se estamos no dia 10 ou depois do mês atual
  if (currentDay >= 10) {
    // Não pode registrar datas do mês anterior (1 mês atrás)
    if (monthsDifference >= 1) {
      const targetFormatted = targetDate.toLocaleDateString('pt-BR');
      const todayFormatted = today.toLocaleDateString('pt-BR');
      
      console.log('❌ Data retroativa fora do prazo legal');
      return {
        isValid: false,
        errorMessage: `Não é possível registrar data retroativa de ${targetFormatted}. Por impeditivo legal da legislação da Receita Saúde, após o dia 10 (hoje é ${todayFormatted}), não é permitido registrar datas retroativas do mês anterior ou anteriores.`
      };
    }
  } else {
    // Antes do dia 10 do mês atual, só pode registrar do mês passado
    if (monthsDifference >= 2) {
      const targetFormatted = targetDate.toLocaleDateString('pt-BR');
      const todayFormatted = today.toLocaleDateString('pt-BR');
      
      console.log('❌ Data retroativa fora do prazo legal');
      return {
        isValid: false,
        errorMessage: `Não é possível registrar data retroativa de ${targetFormatted}. Por impeditivo legal da legislação da Receita Saúde, antes do dia 10 (hoje é ${todayFormatted}), só é permitido registrar datas do mês anterior.`
      };
    }
  }
  
  console.log('⚠️ Data retroativa dentro do prazo legal');
  return { isValid: true };
}

/**
 * Valida data de vencimento considerando regras da Receita Saúde
 */
export function validateDueDateReceitaSaude(dueDate: string) {
  return validateReceitaSaudeDate(dueDate);
}

/**
 * Valida data de pagamento considerando regras da Receita Saúde
 */
export function validatePaymentDateReceitaSaude(paymentDate: string) {
  return validateReceitaSaudeDate(paymentDate);
}

/**
 * Valida data de despesa considerando regras da Receita Saúde
 */
export function validateExpenseDateReceitaSaude(expenseDate: string) {
  return validateReceitaSaudeDate(expenseDate);
}

/**
 * Valida se é possível desmarcar um pagamento que foi registrado em mês anterior
 * Apenas para plano Psi Regular
 */
export function validatePaymentUnmarkRetroactive(paidDate: string, currentPlan?: any) {
  console.log('🔍 Iniciando validação desmarcação:', { 
    paidDate, 
    planSlug: currentPlan?.slug,
    hasPaidDate: !!paidDate 
  });

  // Se não há paid_date, significa que o pagamento nunca foi marcado como pago
  // Neste caso, permitir a operação normalmente
  if (!paidDate || paidDate === '') {
    console.log('✅ Sem data de pagamento registrada - operação permitida');
    return { isValid: true };
  }

  // Se não é plano Psi Regular, permitir desmarcação
  if (currentPlan?.slug !== 'psi_regular') {
    console.log('✅ Plano não é Psi Regular - operação permitida');
    return { isValid: true };
  }

  const paymentDate = new Date(paidDate + 'T00:00:00');
  const today = new Date();
  
  // Normalizar as datas
  paymentDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const paymentMonth = paymentDate.getMonth();
  const paymentYear = paymentDate.getFullYear();
  
  // Calcular diferença em meses
  const monthsDifference = (currentYear - paymentYear) * 12 + (currentMonth - paymentMonth);
  
  console.log('📅 Análise desmarcação:', {
    paidDate,
    paymentDate: paymentDate.toISOString(),
    today: today.toISOString(),
    paymentMonth: paymentMonth + 1,
    currentMonth: currentMonth + 1,
    monthsDifference,
    planSlug: currentPlan?.slug
  });
  
  // Se o pagamento foi registrado em mês anterior, não permitir desmarcação
  if (monthsDifference >= 1) {
    const paymentFormatted = paymentDate.toLocaleDateString('pt-BR');
    
    console.log('❌ Desmarcação bloqueada - pagamento de mês anterior');
    return {
      isValid: false,
      errorMessage: `Não é possível desmarcar um recebimento registrado em ${paymentFormatted}. O mês já foi fechado e para alterações é necessário abrir um chamado.`
    };
  }
  
  console.log('✅ Desmarcação permitida - pagamento do mês atual');
  return { isValid: true };
}