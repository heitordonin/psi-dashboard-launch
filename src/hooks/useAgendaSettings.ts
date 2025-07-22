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
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as AgendaSettings | null;
    },
  });

  const createSettingsMutation = useMutation({
    mutationFn: async (newSettings: Omit<AgendaSettings, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('agenda_settings')
        .insert(newSettings)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-settings'] });
      toast.success('Configurações da agenda criadas com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating agenda settings:', error);
      toast.error('Erro ao criar configurações da agenda');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<AgendaSettings>) => {
      const { data, error } = await supabase
        .from('agenda_settings')
        .update(updatedSettings)
        .eq('user_id', updatedSettings.user_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-settings'] });
      toast.success('Configurações da agenda atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating agenda settings:', error);
      toast.error('Erro ao atualizar configurações da agenda');
    },
  });

  const saveSettings = (settingsData: Omit<AgendaSettings, 'id' | 'created_at' | 'updated_at'>) => {
    if (settings?.id) {
      updateSettingsMutation.mutate(settingsData);
    } else {
      createSettingsMutation.mutate(settingsData);
    }
  };

  return {
    settings,
    isLoading,
    saveSettings,
    isCreating: createSettingsMutation.isPending,
    isUpdating: updateSettingsMutation.isPending,
    isSaving: createSettingsMutation.isPending || updateSettingsMutation.isPending,
  };
};