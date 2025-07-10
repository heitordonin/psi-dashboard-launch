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
  const targetDate = new Date(retroactiveDate);
  const today = currentDate || new Date();
  
  // Se a data não é retroativa, não precisa validar
  if (targetDate >= today) {
    return { isValid: true };
  }
  
  // Calcular o dia 10 do mês subsequente à data retroativa
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();
  
  // Dia 10 do mês seguinte
  const deadline = new Date(targetYear, targetMonth + 1, 10);
  
  // Se hoje é após o dia 10 do mês subsequente, não pode registrar
  if (today > deadline) {
    const deadlineFormatted = deadline.toLocaleDateString('pt-BR');
    const targetFormatted = targetDate.toLocaleDateString('pt-BR');
    
    return {
      isValid: false,
      errorMessage: `Não é possível registrar data retroativa de ${targetFormatted}. Por impeditivo legal da legislação do Receita Saúde, cobranças/pagamentos retroativos devem ser registrados até o dia 10 do mês seguinte (prazo era ${deadlineFormatted}).`
    };
  }
  
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