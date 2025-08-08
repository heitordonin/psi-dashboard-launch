import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, CalendarFilters } from '@/types/appointment';
import { toast } from 'sonner';

export const useAppointments = (filters?: CalendarFilters) => {
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', filters?.date?.toDateString(), filters?.weekRange, filters?.patient_name, filters?.patient_email, filters?.status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('start_datetime', { ascending: true });

      // Apply filters - usar weekRange se fornecido, senão usar date
      if (filters?.weekRange) {
        const { startDate, endDate } = filters.weekRange;
        console.log('🔍 Filtering appointments for week range:', {
          start: startDate.toLocaleDateString(),
          end: endDate.toLocaleDateString()
        });

        query = query
          .gte('start_datetime', startDate.toISOString())
          .lte('start_datetime', endDate.toISOString());
      } else if (filters?.date) {
        const targetDate = new Date(filters.date);
        
        // Simplicar filtragem para o dia específico
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
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

      if (error) {
        console.error('❌ Error fetching appointments:', error);
        throw error;
      }
      
      return data as Appointment[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos para reduzir requisições
    gcTime: 10 * 60 * 1000, // 10 minutos
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
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
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
    updateAppointmentAsync: updateAppointmentMutation.mutateAsync,
    deleteAppointment: deleteAppointmentMutation.mutate,
    isCreating: createAppointmentMutation.isPending,
    isUpdating: updateAppointmentMutation.isPending,
    isDeleting: deleteAppointmentMutation.isPending,
  };
};