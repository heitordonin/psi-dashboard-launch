import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export const useAdminDarfControl = (competencyMonth: string) => {
  const queryClient = useQueryClient();

  const { data: darfStats, isLoading: darfStatsLoading } = useQuery({
    queryKey: ['admin-darf-stats', competencyMonth],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_darf_completion_stats', {
        competency_month: competencyMonth
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
    enabled: !!competencyMonth
  });

  const { data: pendingUsers, isLoading: pendingUsersLoading } = useQuery({
    queryKey: ['admin-darf-pending-users', competencyMonth],
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

      // Get users with DARF sent for this competency
      const { data: usersWithDarf, error: darfError } = await supabase
        .from('admin_documents')
        .select('user_id')
        .ilike('title', '%DARF%')
        .gte('competency', `${competencyMonth}-01`)
        .lt('competency', format(new Date(competencyMonth + '-01'), 'yyyy-MM-01'));

      if (darfError) throw darfError;

      // Get users manually completed
      const { data: manuallyCompleted, error: manualError } = await supabase
        .from('darf_manual_completions')
        .select('user_id')
        .gte('competency', `${competencyMonth}-01`)
        .lt('competency', format(new Date(competencyMonth + '-01'), 'yyyy-MM-01'));

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
    enabled: !!competencyMonth
  });

  const markAsCompletedMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const { error } = await supabase
        .from('darf_manual_completions')
        .insert({
          user_id: userId,
          competency: `${competencyMonth}-01`,
          admin_notes: notes,
          created_by_admin_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-darf-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-darf-pending-users'] });
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

  return {
    darfStats,
    pendingUsers,
    markAsCompleted: markAsCompletedMutation.mutate,
    isMarkingCompleted: markAsCompletedMutation.isPending,
    isLoading: darfStatsLoading || pendingUsersLoading
  };
};