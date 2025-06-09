
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PaymentForm } from './PaymentForm';
import type { Payment } from '@/types/payment';
import type { Patient } from '@/types/patient';

interface PaymentFormWrapperProps {
  payment?: Payment;
  onSave?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function PaymentFormWrapper({ payment, onSave, onCancel, onClose }: PaymentFormWrapperProps) {
  const { user } = useAuth();

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('owner_id', user.id)
        .order('full_name');
      
      if (error) throw error;
      
      // Cast patient_type to ensure strict type safety
      return data.map((p) => ({
        ...p,
        patient_type: p.patient_type as "individual" | "company"
      })) as Patient[];
    },
    enabled: !!user?.id
  });

  return (
    <PaymentForm
      payment={payment}
      patients={patients}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
