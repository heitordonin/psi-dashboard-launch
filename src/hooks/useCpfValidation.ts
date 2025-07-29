import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCpfValidation = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkCpfExists = async (cpf: string): Promise<boolean> => {
    if (!cpf || cpf.length < 11) return false;
    
    setIsChecking(true);
    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf', cleanCpf)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar CPF:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkCpfExists,
    isChecking
  };
};