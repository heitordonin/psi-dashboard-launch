
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignupForm } from '@/components/auth/SignupForm';
import { PlanSelectionBanner } from '@/components/auth/PlanSelectionBanner';
import { InvalidPlanModal } from '@/components/auth/InvalidPlanModal';
import { useCheckoutRedirect } from '@/hooks/useCheckoutRedirect';

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    selectedPlan,
    invalidPlan,
    dismissInvalidPlanModal
  } = useCheckoutRedirect();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src="/lovable-uploads/dd8b5b26-acf5-48d0-8293-7f42227c7b84.png" 
            alt="Psiclo" 
            className="mx-auto h-12 w-auto mb-4"
          />
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedPlan && <PlanSelectionBanner selectedPlan={selectedPlan} />}
          <SignupForm selectedPlan={selectedPlan} />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Faça login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <InvalidPlanModal
        isOpen={invalidPlan}
        onClose={dismissInvalidPlanModal}
      />
    </div>
  );
};

export default Signup;
