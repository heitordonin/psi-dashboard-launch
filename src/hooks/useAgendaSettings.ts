import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AgendaSettings } from '@/types/appointment';
import { toast } from 'sonner';

export const useAgendaSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['agenda-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda_settings')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching agenda settings:', { code: error.code, message: error.message });
        throw error;
      }

      return data as AgendaSettings | null;
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: Omit<AgendaSettings, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('agenda_settings')
        .upsert(settingsData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving agenda settings:', { code: error.code, message: error.message, details: error.details });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-settings'] });
      toast.success('Configurações da agenda salvas com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error saving agenda settings:', { code: error.code, message: error.message, details: error.details });
      toast.error('Erro ao salvar configurações da agenda');
    },
  });

  const saveSettings = (settingsData: Omit<AgendaSettings, 'id' | 'created_at' | 'updated_at'>) => {
    saveSettingsMutation.mutate(settingsData);
  };

  return {
    settings,
    isLoading,
    saveSettings,
    isSaving: saveSettingsMutation.isPending,
  };
};