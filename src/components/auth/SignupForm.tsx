
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { SignupFormFields } from './SignupFormFields';
import { SignupFormData, validateSignupForm, sanitizeSignupFormData } from './SignupFormValidation';
import { useCpfValidation } from '@/hooks/useCpfValidation';
import { CpfExistsModal } from './CpfExistsModal';
import { toast } from 'sonner';
import { ValidPlan } from '@/utils/planValidation';
import { supabase } from '@/integrations/supabase/client';

interface SignupFormProps {
  onSuccess?: () => void;
  selectedPlan?: ValidPlan | null;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, selectedPlan }) => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    cpf: '',
    phone: '',
    acceptedTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCpfExistsModal, setShowCpfExistsModal] = useState(false);
  const { signUp } = useAuth();
  const { checkCpfExists, isChecking } = useCpfValidation();
  const navigate = useNavigate();

  const handleFieldChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateSignupForm(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      // Verificar se o CPF já existe antes de tentar criar a conta
      const cpfExists = await checkCpfExists(formData.cpf, formData.email);
      
      if (cpfExists) {
        setLoading(false);
        setShowCpfExistsModal(true);
        return;
      }

      // Sanitizar dados antes de enviar
      const sanitizedData = sanitizeSignupFormData(formData);

      const { error } = await signUp(sanitizedData.email, sanitizedData.password, {
        full_name: sanitizedData.fullName,
        cpf: sanitizedData.cpf,
        phone: sanitizedData.phone
      });

      if (error) throw error;

      // Salvar aceite dos termos após signup bem-sucedido
      try {
        await supabase.functions.invoke('save-terms-acceptance', {
          body: {
            email: sanitizedData.email,
            formType: 'user_signup'
          }
        });
      } catch (termsError) {
        console.error('Erro ao salvar aceite dos termos:', termsError);
        // Não falhar o processo por erro nos termos
      }

      toast.success("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.", {
        duration: 5000,
        style: {
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          color: '#0c4a6e'
        }
      });

      onSuccess?.();
      
      if (selectedPlan) {
        // Executar checkout automaticamente pós-signup
        toast.info("Redirecionando para o checkout...");
        
        try {
          // Para checkout pós-signup, enviar dados do usuário diretamente
          const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
            body: { 
              planSlug: selectedPlan,
              postSignup: true, // Flag especial para checkout pós-signup
              userData: {
                email: sanitizedData.email,
                full_name: sanitizedData.fullName,
                cpf: sanitizedData.cpf,
                phone: sanitizedData.phone
              }
            }
          });

          if (error) throw error;

          if (data?.url) {
            // Redirecionar para Stripe Checkout
            window.location.href = data.url;
            return;
          }
        } catch (checkoutError) {
          console.error('Erro no checkout pós-signup:', checkoutError);
          toast.error('Erro ao processar checkout. Redirecionando para login...');
          // Fallback: redirecionar para login
          navigate(`/login?plan=${selectedPlan}`);
          return;
        }
      } else {
        navigate('/login');
      }

    } catch (error: any) {
      console.error('Error:', error);
      
      // Verificar se é erro de CPF duplicado específico do banco
      if (error.message?.includes('duplicate key value violates unique constraint "unique_cpf"') ||
          error.message?.includes('Database error saving new user')) {
        setShowCpfExistsModal(true);
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SignupFormFields
          formData={formData}
          errors={errors}
          onFieldChange={handleFieldChange}
        />
        
        <Button type="submit" className="w-full" disabled={loading || isChecking}>
          {loading ? 'Criando conta...' : isChecking ? 'Verificando CPF...' : 'Criar Conta'}
        </Button>
      </form>

      <CpfExistsModal
        isOpen={showCpfExistsModal}
        onClose={() => setShowCpfExistsModal(false)}
        email={formData.email}
        cpf={formData.cpf}
      />
    </>
  );
};
