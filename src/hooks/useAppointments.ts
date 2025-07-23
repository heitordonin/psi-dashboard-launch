
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, CalendarFilters } from '@/types/appointment';
import { toast } from 'sonner';

export const useAppointments = (filters?: CalendarFilters) => {
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('user_id', user.id)
        .order('start_datetime', { ascending: true });

      // Apply filters
      if (filters?.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('start_datetime', startOfDay.toISOString())
          .lte('start_datetime', endOfDay.toISOString());
      }

      if (filters?.patient_name) {
        query = query.ilike('patient_name', `%${filters.patient_name}%`);
      }

      if (filters?.patient_email) {
        query = query.ilike('patient_email', `%${filters.patient_email}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Appointment[];
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (newAppointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('📝 Creating appointment with data:', newAppointment);
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(newAppointment)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating appointment:', error);
        throw error;
      }
      
      console.log('✅ Appointment created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Appointment mutation successful:', data);
      // Invalidar cache com refetch forçado
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.refetchQueries({ queryKey: ['appointments'] });
      // Forçar recarregamento após um pequeno delay
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['appointments'] });
      }, 100);
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error) => {
      console.error('❌ Appointment mutation error:', error);
      toast.error(`Erro ao criar agendamento: ${error.message}`);
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, ...updatedAppointment }: Partial<Appointment> & { id: string }) => {
      console.log('📝 Updating appointment with data:', { id, ...updatedAppointment });
      
      const { data, error } = await supabase
        .from('appointments')
        .update(updatedAppointment)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating appointment:', error);
        throw error;
      }
      
      console.log('✅ Appointment updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Appointment update mutation successful:', data);
      // Invalidar e refazer queries múltiplas vezes para garantir atualização
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.refetchQueries({ queryKey: ['appointments'] });
      // Forçar recarregamento após delay
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['appointments'] });
      }, 100);
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('❌ Appointment update mutation error:', error);
      toast.error(`Erro ao atualizar agendamento: ${error.message}`);
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar e refazer queries para garantir atualização
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.refetchQueries({ queryKey: ['appointments'] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['appointments'] });
      }, 100);
      toast.success('Agendamento deletado com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      toast.error('Erro ao deletar agendamento');
    },
  });

  return {
    appointments,
    isLoading,
    createAppointment: createAppointmentMutation.mutate,
    createAppointmentAsync: createAppointmentMutation.mutateAsync,
    updateAppointment: updateAppointmentMutation.mutate,
    updateAppointmentAsync: updateAppointmentMutation.mutateAsync,
    deleteAppointment: deleteAppointmentMutation.mutate,
    isCreating: createAppointmentMutation.isPending,
    isUpdating: updateAppointmentMutation.isPending,
    isDeleting: deleteAppointmentMutation.isPending,
  };
};
