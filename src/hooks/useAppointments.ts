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

      // Apply filters - expandir range para capturar appointments UTC em qualquer timezone
      if (filters?.date) {
        const targetDate = new Date(filters.date);
        console.log('🔍 Filtering appointments for date:', targetDate.toLocaleDateString());
        
        // Expandir range: 24h antes e 24h depois para capturar todos os appointments UTC
        // que podem aparecer no dia local devido a diferenças de timezone
        const startRange = new Date(targetDate);
        startRange.setDate(startRange.getDate() - 1);
        startRange.setHours(0, 0, 0, 0);
        
        const endRange = new Date(targetDate);
        endRange.setDate(endRange.getDate() + 1);
        endRange.setHours(23, 59, 59, 999);

        console.log('📅 Date filter range:', {
          target: targetDate.toLocaleDateString(),
          start: startRange.toISOString(),
          end: endRange.toISOString()
        });

        query = query
          .gte('start_datetime', startRange.toISOString())
          .lte('start_datetime', endRange.toISOString());
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
      
      console.log('📊 Appointments fetched from DB:', data?.length || 0);
      data?.forEach(apt => {
        console.log(`📋 Appointment: ${apt.title} at ${apt.start_datetime} (UTC)`);
      });
      
      return data as Appointment[];
    },
    staleTime: 30 * 1000, // 30 segundos - mais agressivo para debugging
    gcTime: 5 * 60 * 1000, // 5 minutos
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
      // Invalidação mais agressiva do cache
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.removeQueries({ queryKey: ['appointments'] });
      
      // Múltiplos refetch para garantir sincronização
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['appointments'] });
      }, 50);
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['appointments'] });
      }, 200);
      
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
      // Invalidação mais agressiva para updates
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.removeQueries({ queryKey: ['appointments'] });
      
      // Múltiplos refetch para garantir sincronização
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['appointments'] });
      }, 50);
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['appointments'] });
      }, 200);
      
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