
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useDataExport } from '@/hooks/useDataExport';
import { Download, Users, CreditCard, FileText, Calendar } from 'lucide-react';

const Admin = () => {
  const { isAdmin } = useAuth();
  const { exportPatients, exportPayments, exportExpenses } = useDataExport();
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  // Estatísticas gerais
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [patientsResult, paymentsResult, expensesResult] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact' }),
        supabase.from('payments').select('id, amount, status', { count: 'exact' }),
        supabase.from('expenses').select('id, amount', { count: 'exact' }),
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

  // Dados de pacientes
  const { data: patients = [] } = useQuery({
    queryKey: ['admin-patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  // Dados de pagamentos
  const { data: payments = [] } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients!inner(full_name, cpf)
        `)
        .order('created_at', { ascending: false })
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

  const handleExport = (type: 'patients' | 'payments' | 'expenses') => {
    const options = {
      format: 'csv' as const,
      ...(dateRange.start && dateRange.end && {
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      }),
    };

    switch (type) {
      case 'patients':
        exportPatients(options);
        break;
      case 'payments':
        exportPayments(options);
        break;
      case 'expenses':
        exportExpenses(options);
        break;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Painel Administrativo</h1>
              <Badge variant="secondary" className="text-sm">
                Modo Administrador
              </Badge>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Cobranças</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPayments || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats?.totalRevenue || 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats?.totalExpenseAmount || 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exportação */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="start-date">Data Início (opcional)</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">Data Fim (opcional)</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => handleExport('patients')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Pacientes
                  </Button>
                  <Button 
                    onClick={() => handleExport('payments')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Cobranças
                  </Button>
                  <Button 
                    onClick={() => handleExport('expenses')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Despesas
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Visualização dos dados */}
            <Tabs defaultValue="patients" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="patients">Pacientes</TabsTrigger>
                <TabsTrigger value="payments">Cobranças</TabsTrigger>
                <TabsTrigger value="expenses">Despesas</TabsTrigger>
              </TabsList>

              <TabsContent value="patients">
                <Card>
                  <CardHeader>
                    <CardTitle>Últimos Pacientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Nome</th>
                            <th className="text-left p-2">CPF</th>
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Telefone</th>
                            <th className="text-left p-2">Criado em</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patients.slice(0, 10).map((patient) => (
                            <tr key={patient.id} className="border-b">
                              <td className="p-2">{patient.full_name}</td>
                              <td className="p-2">{patient.cpf}</td>
                              <td className="p-2">{patient.email || '-'}</td>
                              <td className="p-2">{patient.phone || '-'}</td>
                              <td className="p-2">
                                {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle>Últimas Cobranças</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Paciente</th>
                            <th className="text-left p-2">Valor</th>
                            <th className="text-left p-2">Vencimento</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Criado em</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.slice(0, 10).map((payment) => (
                            <tr key={payment.id} className="border-b">
                              <td className="p-2">{payment.patients?.full_name}</td>
                              <td className="p-2">
                                {payment.amount.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </td>
                              <td className="p-2">
                                {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="p-2">
                                <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                                  {payment.status === 'paid' ? 'Pago' : 
                                   payment.status === 'pending' ? 'Pendente' : 
                                   payment.status}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses">
                <Card>
                  <CardHeader>
                    <CardTitle>Despesas (Dados limitados para proteção)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Por questões de segurança, os detalhes das despesas são limitados na visualização web.
                      Use a funcionalidade de exportação para obter dados completos.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
