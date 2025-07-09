import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export const useAdminDarfControl = (dueMonth: string) => {
  const queryClient = useQueryClient();

  const { data: darfStats, isLoading: darfStatsLoading } = useQuery({
    queryKey: ['admin-darf-stats', dueMonth],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_darf_completion_stats', {
        due_month: dueMonth + '-01'
      });
      if (error) throw error;
      return data[0] || {
        total_psi_regular_users: 0,
        users_with_darf_sent: 0,
        users_manually_completed: 0,
        users_pending: 0,
        completion_percentage: 0
      };
    },
    enabled: !!dueMonth
  });

  const { data: pendingUsers, isLoading: pendingUsersLoading } = useQuery({
    queryKey: ['admin-darf-pending-users', dueMonth],
    queryFn: async () => {
      // Get Psi Regular users with their subscription info
      const { data: subscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select(`
          user_id,
          subscription_plans!inner(slug)
        `)
        .eq('status', 'active')
        .eq('subscription_plans.slug', 'psi_regular')
        .is('expires_at', null);

      if (subsError) throw subsError;

      if (!subscriptions || subscriptions.length === 0) {
        return [];
      }

      const psiRegularUserIds = subscriptions.map(s => s.user_id);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, cpf')
        .in('id', psiRegularUserIds);

      if (profilesError) throw profilesError;

      // Get users with DARF sent for this due month
      const startOfMonth = `${dueMonth}-01`;
      const nextMonth = new Date(dueMonth + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const endOfMonth = format(nextMonth, 'yyyy-MM-dd');

      const { data: usersWithDarf, error: darfError } = await supabase
        .from('admin_documents')
        .select('user_id')
        .ilike('title', '%DARF%')
        .gte('due_date', startOfMonth)
        .lt('due_date', endOfMonth)
        .eq('hidden_from_user', false); // Excluir documentos deletados

      if (darfError) throw darfError;

      // Get users manually completed
      const { data: manuallyCompleted, error: manualError } = await supabase
        .from('darf_manual_completions')
        .select('user_id')
        .gte('competency', startOfMonth)
        .lt('competency', endOfMonth);

      if (manualError) throw manualError;

      const darfUserIds = new Set(usersWithDarf?.map(d => d.user_id) || []);
      const manualUserIds = new Set(manuallyCompleted?.map(m => m.user_id) || []);

      // Filter and format the result
      return profiles?.filter(profile => 
        !darfUserIds.has(profile.id) && !manualUserIds.has(profile.id)
      ).map(profile => ({
        user_id: profile.id,
        profiles: {
          id: profile.id,
          full_name: profile.full_name || '',
          cpf: profile.cpf || '',
          email: `usuário-${profile.id.substring(0, 8)}` // Placeholder since email is not in profiles
        }
      })) || [];
    },
    enabled: !!dueMonth
  });

  const { data: sentUsers, isLoading: sentUsersLoading } = useQuery({
    queryKey: ['admin-darf-sent-users', dueMonth],
    queryFn: async () => {
      // Get Psi Regular users with their subscription info
      const { data: subscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select(`
          user_id,
          subscription_plans!inner(slug)
        `)
        .eq('status', 'active')
        .eq('subscription_plans.slug', 'psi_regular')
        .is('expires_at', null);

      if (subsError) throw subsError;

      if (!subscriptions || subscriptions.length === 0) {
        return [];
      }

      const psiRegularUserIds = subscriptions.map(s => s.user_id);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, cpf')
        .in('id', psiRegularUserIds);

      if (profilesError) throw profilesError;

      // Get users with DARF sent for this due month
      const startOfMonth = `${dueMonth}-01`;
      const nextMonth = new Date(dueMonth + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const endOfMonth = format(nextMonth, 'yyyy-MM-dd');

      const { data: usersWithDarf, error: darfError } = await supabase
        .from('admin_documents')
        .select('user_id, title, status, created_at')
        .ilike('title', '%DARF%')
        .gte('due_date', startOfMonth)
        .lt('due_date', endOfMonth)
        .eq('hidden_from_user', false); // Excluir documentos deletados

      if (darfError) throw darfError;

      // Get users manually completed
      const { data: manuallyCompleted, error: manualError } = await supabase
        .from('darf_manual_completions')
        .select('user_id, admin_notes, marked_completed_at')
        .gte('competency', startOfMonth)
        .lt('competency', endOfMonth);

      if (manualError) throw manualError;

      const darfUserIds = new Set(usersWithDarf?.map(d => d.user_id) || []);
      const manualUserIds = new Set(manuallyCompleted?.map(m => m.user_id) || []);

      // Filter users who have DARF sent OR manually completed
      return profiles?.filter(profile => 
        darfUserIds.has(profile.id) || manualUserIds.has(profile.id)
      ).map(profile => {
        const darfDoc = usersWithDarf?.find(d => d.user_id === profile.id);
        const manualCompletion = manuallyCompleted?.find(m => m.user_id === profile.id);
        
        return {
          user_id: profile.id,
          profiles: {
            id: profile.id,
            full_name: profile.full_name || '',
            cpf: profile.cpf || ''
          },
          darf_document: darfDoc || null,
          manual_completion: manualCompletion || null,
          completion_type: (darfDoc ? 'document' : 'manual') as 'document' | 'manual'
        };
      }) || [];
    },
    enabled: !!dueMonth
  });

  const markAsCompletedMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const { error } = await supabase
        .from('darf_manual_completions')
        .insert({
          user_id: userId,
          competency: `${dueMonth}-01`,
          admin_notes: notes,
          created_by_admin_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-darf-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-darf-pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-darf-sent-users'] });
      toast({
        title: "Sucesso",
        description: "DARF marcado como concluído manualmente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao marcar DARF como concluído.",
        variant: "destructive"
      });
      console.error('Error marking DARF as completed:', error);
    }
  });

  const unmarkCompletedMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase
        .from('darf_manual_completions')
        .delete()
        .eq('user_id', userId)
        .gte('competency', `${dueMonth}-01`)
        .lt('competency', format(new Date(dueMonth + '-01').setMonth(new Date(dueMonth + '-01').getMonth() + 1), 'yyyy-MM-dd'));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-darf-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-darf-pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-darf-sent-users'] });
      toast({
        title: "Sucesso",
        description: "Marcação manual removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover marcação manual.",
        variant: "destructive"
      });
      console.error('Error unmarking DARF as completed:', error);
    }
  });

  return {
    darfStats,
    pendingUsers,
    sentUsers,
    markAsCompleted: markAsCompletedMutation.mutate,
    unmarkCompleted: unmarkCompletedMutation.mutate,
    isMarkingCompleted: markAsCompletedMutation.isPending,
    isUnmarkingCompleted: unmarkCompletedMutation.isPending,
    isLoading: darfStatsLoading || pendingUsersLoading || sentUsersLoading
  };
};