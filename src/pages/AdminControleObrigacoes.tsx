import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { AdminDarfControlBox } from "@/components/admin/AdminDarfControlBox";
import { AdminTopEarnersTable } from "@/components/admin/AdminTopEarnersTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileCheck, Clock, TrendingUp } from "lucide-react";

interface TopEarner {
  user_id: string;
  user_name: string;
  total_revenue: number;
}

const AdminControleObrigacoes = () => {
  // KPI: Total de usuários Psi Regular ativos
  const { data: psiRegularUsersCount } = useQuery({
    queryKey: ['admin-psi-regular-users-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id', { count: 'exact' })
        .eq('status', 'active')
        .in('plan_id', [
          await supabase
            .from('subscription_plans')
            .select('id')
            .eq('slug', 'psi_regular')
            .single()
            .then(({ data }) => data?.id)
        ].filter(Boolean));
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Top 10 usuários Psi Regular por receita
  const { data: topPsiRegularEarners } = useQuery({
    queryKey: ['admin-top-psi-regular-earners'],
    queryFn: async () => {
      // Primeiro, buscar os IDs dos usuários com plano Psi Regular ativo
      const { data: psiRegularUsers, error: usersError } = await supabase
        .from('user_subscriptions')
        .select(`
          user_id,
          subscription_plans!inner(slug)
        `)
        .eq('status', 'active')
        .eq('subscription_plans.slug', 'psi_regular');

      if (usersError) throw usersError;

      const userIds = psiRegularUsers?.map(u => u.user_id) || [];
      
      if (userIds.length === 0) return [];

      // Buscar receitas dos usuários Psi Regular
      const { data: earnings, error: earningsError } = await supabase
        .from('payments')
        .select(`
          owner_id,
          amount,
          profiles!fk_payments_owner_id (
            full_name,
            display_name
          )
        `)
        .eq('status', 'paid')
        .in('owner_id', userIds);

      if (earningsError) throw earningsError;

      // Agrupar por usuário e calcular totais
      const userEarnings = earnings?.reduce((acc: any, payment: any) => {
        const userId = payment.owner_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            user_name: payment.profiles?.full_name || payment.profiles?.display_name || 'Usuário sem nome',
            total_revenue: 0
          };
        }
        acc[userId].total_revenue += Number(payment.amount || 0);
        return acc;
      }, {});

      return Object.values(userEarnings || {})
        .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
        .slice(0, 10) as TopEarner[];
    }
  });

  // KPI adicional: Taxa de completude atual (usando o hook existente)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: currentCompletionStats } = useQuery({
    queryKey: ['admin-current-darf-stats', currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_darf_completion_stats', {
        due_month: currentMonth + '-01'
      });
      if (error) throw error;
      return data[0] || { completion_percentage: 0, users_pending: 0, total_psi_regular_users: 0 };
    }
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <h1 className="text-xl font-semibold">Controle de Obrigações - Psi Regular</h1>
          </header>
          
          <div className="container mx-auto p-6 space-y-6">
            {/* KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Psi Regular</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{psiRegularUsersCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Total ativos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Completude</CardTitle>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentCompletionStats?.completion_percentage || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Mês atual</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentCompletionStats?.users_pending || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Mês atual</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Earners</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{topPsiRegularEarners?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Usuários com receita</p>
                </CardContent>
              </Card>
            </div>

            {/* Controle de Obrigações */}
            <AdminDarfControlBox />

            {/* Top 10 Earners Psi Regular */}
            <AdminTopEarnersTable topEarners={topPsiRegularEarners || []} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminControleObrigacoes;