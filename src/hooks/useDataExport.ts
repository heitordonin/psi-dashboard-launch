
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface ExportOptions {
  format: 'csv' | 'excel';
  dateRange?: {
    start: string;
    end: string;
  };
}

export const useDataExport = () => {
  const { isAdmin } = useAuth();

  const convertToCSV = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(',');
    const csvData = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    ).join('\n');
    
    return `${csvHeaders}\n${csvData}`;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportPatients = async (options: ExportOptions) => {
    if (!isAdmin) {
      toast.error('Acesso negado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          full_name,
          cpf,
          email,
          phone,
          has_financial_guardian,
          guardian_cpf,
          is_payment_from_abroad,
          created_at,
          updated_at
        `)
        .order('full_name');

      if (error) throw error;

      const headers = [
        'id', 'full_name', 'cpf', 'email', 'phone', 
        'has_financial_guardian', 'guardian_cpf', 'is_payment_from_abroad',
        'created_at', 'updated_at'
      ];

      const csvContent = convertToCSV(data || [], headers);
      const timestamp = new Date().toISOString().split('T')[0];
      
      downloadFile(
        csvContent, 
        `pacientes_${timestamp}.csv`, 
        'text/csv;charset=utf-8;'
      );

      toast.success('Dados dos pacientes exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting patients:', error);
      toast.error('Erro ao exportar dados dos pacientes');
    }
  };

  const exportPayments = async (options: ExportOptions) => {
    if (!isAdmin) {
      toast.error('Acesso negado');
      return;
    }

    try {
      let query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          due_date,
          paid_date,
          status,
          description,
          payment_url,
          payer_cpf,
          created_at,
          patients!inner(full_name, cpf)
        `);

      if (options.dateRange) {
        query = query
          .gte('created_at', options.dateRange.start)
          .lte('created_at', options.dateRange.end);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const flattenedData = data?.map(payment => ({
        id: payment.id,
        patient_name: payment.patients?.full_name,
        patient_cpf: payment.patients?.cpf,
        amount: payment.amount,
        due_date: payment.due_date,
        paid_date: payment.paid_date,
        status: payment.status,
        description: payment.description,
        payment_url: payment.payment_url,
        payer_cpf: payment.payer_cpf,
        created_at: payment.created_at,
      }));

      const headers = [
        'id', 'patient_name', 'patient_cpf', 'amount', 'due_date', 
        'paid_date', 'status', 'description', 'payment_url', 'payer_cpf', 'created_at'
      ];

      const csvContent = convertToCSV(flattenedData || [], headers);
      const timestamp = new Date().toISOString().split('T')[0];
      
      downloadFile(
        csvContent, 
        `cobrancas_${timestamp}.csv`, 
        'text/csv;charset=utf-8;'
      );

      toast.success('Dados das cobranças exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting payments:', error);
      toast.error('Erro ao exportar dados das cobranças');
    }
  };

  const exportExpenses = async (options: ExportOptions) => {
    if (!isAdmin) {
      toast.error('Acesso negado');
      return;
    }

    try {
      let query = supabase
        .from('expenses')
        .select(`
          id,
          amount,
          payment_date,
          competency,
          description,
          penalty_interest,
          is_residential,
          residential_adjusted_amount,
          created_at,
          expense_categories!inner(name, code)
        `);

      if (options.dateRange) {
        query = query
          .gte('created_at', options.dateRange.start)
          .lte('created_at', options.dateRange.end);
      }

      const { data, error } = await query.order('payment_date', { ascending: false });

      if (error) throw error;

      const flattenedData = data?.map(expense => ({
        id: expense.id,
        category_name: expense.expense_categories?.name,
        category_code: expense.expense_categories?.code,
        amount: expense.amount,
        payment_date: expense.payment_date,
        competency: expense.competency,
        description: expense.description,
        penalty_interest: expense.penalty_interest,
        is_residential: expense.is_residential,
        residential_adjusted_amount: expense.residential_adjusted_amount,
        created_at: expense.created_at,
      }));

      const headers = [
        'id', 'category_name', 'category_code', 'amount', 'payment_date',
        'competency', 'description', 'penalty_interest', 'is_residential',
        'residential_adjusted_amount', 'created_at'
      ];

      const csvContent = convertToCSV(flattenedData || [], headers);
      const timestamp = new Date().toISOString().split('T')[0];
      
      downloadFile(
        csvContent, 
        `despesas_${timestamp}.csv`, 
        'text/csv;charset=utf-8;'
      );

      toast.success('Dados das despesas exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting expenses:', error);
      toast.error('Erro ao exportar dados das despesas');
    }
  };

  return {
    exportPatients,
    exportPayments,
    exportExpenses,
  };
};
