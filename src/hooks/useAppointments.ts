
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, CalendarFilters } from '@/types/appointment';
import { toast } from 'sonner';

export const useAppointments = (filters?: CalendarFilters) => {
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
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
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error) => {
      console.error('❌ Appointment mutation error:', error);
      toast.error(`Erro ao criar agendamento: ${error.message}`);
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, ...updatedAppointment }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updatedAppointment)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast.error('Erro ao atualizar agendamento');
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
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
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
    deleteAppointment: deleteAppointmentMutation.mutate,
    isCreating: createAppointmentMutation.isPending,
    isUpdating: updateAppointmentMutation.isPending,
    isDeleting: deleteAppointmentMutation.isPending,
  };
};
