
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/SupabaseAuthContext";

interface Bank {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

interface BankData {
  bank_code: string;
  agency: string;
  agency_digit: string;
  account: string;
  account_digit: string;
  type: string;
}

export const useRecipientSetup = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [bankData, setBankData] = useState<BankData>({
    bank_code: '',
    agency: '',
    agency_digit: '',
    account: '',
    account_digit: '',
    type: 'conta_corrente'
  });

  useEffect(() => {
    checkRecipientStatus();
    loadBanks();
  }, [user]);

  const loadBanks = async () => {
    try {
      setBanksLoading(true);
      const { data, error } = await supabase
        .from('banks')
        .select('id, code, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setBanks(data || []);
    } catch (error) {
      console.error('Error loading banks:', error);
      toast.error('Erro ao carregar lista de bancos');
    } finally {
      setBanksLoading(false);
    }
  };

  const checkRecipientStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('pagarme_recipient_id, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.pagarme_recipient_id) {
        setRecipientId(data.pagarme_recipient_id);
      }
    } catch (error) {
      console.error('Error checking recipient status:', error);
    }
  };

  const handleCreateRecipient = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, cpf')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.full_name || !profile?.cpf) {
        toast.error('Por favor, complete seu perfil com nome completo e CPF antes de configurar pagamentos.');
        return;
      }

      const accountType = bankData.type === 'conta_corrente' ? 'checking' : 'savings';

      const { data, error } = await supabase.functions.invoke('create-pagarme-recipient', {
        body: {
          legal_name: profile.full_name,
          cpf: profile.cpf,
          bank_code: bankData.bank_code,
          agency_number: bankData.agency,
          agency_digit: bankData.agency_digit || undefined,
          account_number: bankData.account,
          account_digit: bankData.account_digit,
          account_type: accountType
        }
      });

      if (error) throw error;

      if (data.success) {
        setRecipientId(data.recipient_id);
        toast.success('Conta de recebimento criada com sucesso!');
        
        setBankData({
          bank_code: '',
          agency: '',
          agency_digit: '',
          account: '',
          account_digit: '',
          type: 'conta_corrente'
        });
      } else {
        throw new Error(data.error || 'Erro ao criar conta de recebimento');
      }
    } catch (error) {
      console.error('Error creating recipient:', error);
      toast.error('Erro ao criar conta de recebimento: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    banksLoading,
    banks,
    recipientId,
    bankData,
    setBankData,
    handleCreateRecipient
  };
};
