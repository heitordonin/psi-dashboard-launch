import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { UserFilter } from '@/components/admin/UserFilter';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { AdminExportSection } from '@/components/admin/AdminExportSection';
import { AdminDataTabs } from '@/components/admin/AdminDataTabs';

const PainelPsiRegular = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [filteredUserId, setFilteredUserId] = useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(true);

  const handleFilterChange = (userId: string | null, showAll: boolean) => {
    setFilteredUserId(userId);
    setShowAllUsers(showAll);
  };

  // Estatísticas gerais com filtro de usuário (apenas Psi Regular)
  const { data: stats } = useQuery({
    queryKey: ['admin-psi-regular-stats', filteredUserId, showAllUsers],
    queryFn: async () => {
      // Get Psi Regular plan ID
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', 'psi_regular')
        .single();

      if (!planData) {
        return {
          totalPatients: 0,
          totalPayments: 0,
          totalExpenses: 0,
          totalRevenue: 0,
          totalExpenseAmount: 0,
        };
      }

      // Get all Psi Regular user IDs
      const { data: psiRegularUserIds } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .eq('plan_id', planData.id);

      const psiRegularIds = psiRegularUserIds?.map(sub => sub.user_id) || [];
      
      if (psiRegularIds.length === 0) {
        return {
          totalPatients: 0,
          totalPayments: 0,
          totalExpenses: 0,
          totalRevenue: 0,
          totalExpenseAmount: 0,
        };
      }

      // Apply user filter within Psi Regular users only
      const targetUserIds = showAllUsers ? psiRegularIds : 
        (filteredUserId && psiRegularIds.includes(filteredUserId) ? [filteredUserId] : []);

      if (targetUserIds.length === 0) {
        return {
          totalPatients: 0,
          totalPayments: 0,
          totalExpenses: 0,
          totalRevenue: 0,
          totalExpenseAmount: 0,
        };
      }

      const [patientsResult, paymentsResult, expensesResult] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact' }).in('owner_id', targetUserIds),
        supabase.from('payments').select('id, amount, status', { count: 'exact' }).in('owner_id', targetUserIds),
        supabase.from('expenses').select('id, amount', { count: 'exact' }).in('owner_id', targetUserIds),
      ]);

      const totalRevenue = paymentsResult.data?.reduce((sum, payment) => 
        payment.status === 'paid' ? sum + payment.amount : sum, 0
      ) || 0;

      const totalExpenses = expensesResult.data?.reduce((sum, expense) => 
        sum + expense.amount, 0
      ) || 0;

      return {
        totalPatients: patientsResult.count || 0,
        totalPayments: paymentsResult.count || 0,
        totalExpenses: expensesResult.count || 0,
        totalRevenue,
        totalExpenseAmount: totalExpenses,
      };
    },
    enabled: !!isAdmin,
  });

  // Dados de pacientes com filtro (apenas Psi Regular)
  const { data: patients = [] } = useQuery({
    queryKey: ['admin-psi-regular-patients', filteredUserId, showAllUsers],
    queryFn: async () => {
      // Get Psi Regular plan ID
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', 'psi_regular')
        .single();

      if (!planData) return [];

      // Get all Psi Regular user IDs
      const { data: psiRegularUserIds } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .eq('plan_id', planData.id);

      const psiRegularIds = psiRegularUserIds?.map(sub => sub.user_id) || [];
      
      if (psiRegularIds.length === 0) return [];

      // Apply user filter within Psi Regular users only
      const targetUserIds = showAllUsers ? psiRegularIds : 
        (filteredUserId && psiRegularIds.includes(filteredUserId) ? [filteredUserId] : []);

      if (targetUserIds.length === 0) return [];

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .in('owner_id', targetUserIds)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  // Dados de pagamentos com filtro (apenas Psi Regular)
  const { data: payments = [] } = useQuery({
    queryKey: ['admin-psi-regular-payments', filteredUserId, showAllUsers],
    queryFn: async () => {
      // Get Psi Regular plan ID
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', 'psi_regular')
        .single();

      if (!planData) return [];

      // Get all Psi Regular user IDs
      const { data: psiRegularUserIds } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .eq('plan_id', planData.id);

      const psiRegularIds = psiRegularUserIds?.map(sub => sub.user_id) || [];
      
      if (psiRegularIds.length === 0) return [];

      // Apply user filter within Psi Regular users only
      const targetUserIds = showAllUsers ? psiRegularIds : 
        (filteredUserId && psiRegularIds.includes(filteredUserId) ? [filteredUserId] : []);

      if (targetUserIds.length === 0) return [];

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients!inner(full_name, cpf)
        `)
        .in('owner_id', targetUserIds)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  // Dados de despesas com filtro (apenas Psi Regular)
  const { data: expenses = [] } = useQuery({
    queryKey: ['admin-psi-regular-expenses', filteredUserId, showAllUsers],
    queryFn: async () => {
      // Get Psi Regular plan ID
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', 'psi_regular')
        .single();

      if (!planData) return [];

      // Get all Psi Regular user IDs
      const { data: psiRegularUserIds } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .eq('plan_id', planData.id);

      const psiRegularIds = psiRegularUserIds?.map(sub => sub.user_id) || [];
      
      if (psiRegularIds.length === 0) return [];

      // Apply user filter within Psi Regular users only
      const targetUserIds = showAllUsers ? psiRegularIds : 
        (filteredUserId && psiRegularIds.includes(filteredUserId) ? [filteredUserId] : []);

      if (targetUserIds.length === 0) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories!inner(name, code)
        `)
        .in('owner_id', targetUserIds)
        .order('payment_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Painel Psi Regular</h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>Controle e gestão para Psi Regular</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                className="text-white hover:text-gray-200 hover:bg-white/10"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Badge variant="secondary" className="text-sm">
                Modo Administrador - Psi Regular
              </Badge>
            </div>

            {/* Filtro de Usuário */}
            <UserFilter onFilterChange={handleFilterChange} />

            {/* Estatísticas */}
            <AdminStatsCards stats={stats} showAllUsers={showAllUsers} />

            {/* Exportação */}
            <AdminExportSection 
              showAllUsers={showAllUsers}
              filteredUserId={filteredUserId}
            />

            {/* Visualização dos dados */}
            <AdminDataTabs
              patients={patients}
              payments={payments}
              expenses={expenses}
              filteredUserId={filteredUserId}
              showAllUsers={showAllUsers}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PainelPsiRegular;