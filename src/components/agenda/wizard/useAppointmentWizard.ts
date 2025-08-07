import { useState, useEffect } from 'react';
import { AppointmentWizardData, Appointment } from '@/types/appointment';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { useAgendaSettings } from '@/hooks/useAgendaSettings';
import { supabase } from '@/integrations/supabase/client';
import { addMinutes } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const initialData: AppointmentWizardData = {
  title: '',
  start_datetime: new Date(),
  end_datetime: new Date(),
  send_email_reminder: false,
  send_whatsapp_reminder: false,
  send_immediate_reminder: false,
};

export const useAppointmentWizard = (editingAppointment?: Appointment | null) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const { user } = useSecureAuth();
  const { createAppointmentAsync, updateAppointmentAsync, isCreating, isUpdating } = useAppointments();
  const { settings } = useAgendaSettings();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<AppointmentWizardData>(() => {
    if (editingAppointment) {
      console.log('🔄 Initializing wizard with editing appointment:', editingAppointment);
      return {
        title: editingAppointment.title,
        start_datetime: new Date(editingAppointment.start_datetime),
        end_datetime: new Date(editingAppointment.end_datetime),
        patient_id: editingAppointment.patient_id,
        patient_name: editingAppointment.patient_name || '',
        patient_email: editingAppointment.patient_email || '',
        patient_phone: editingAppointment.patient_phone || '',
        send_email_reminder: editingAppointment.send_email_reminder,
        send_whatsapp_reminder: editingAppointment.send_whatsapp_reminder,
        send_immediate_reminder: false,
        notes: editingAppointment.notes || '',
      };
    }
    
    console.log('🆕 Initializing wizard with new appointment');
    return initialData;
  });

  // Reinitialize form data when editingAppointment changes
  useEffect(() => {
    if (editingAppointment) {
      console.log('🔄 Reinitializing form data with editing appointment:', editingAppointment);
      setFormData({
        title: editingAppointment.title,
        start_datetime: new Date(editingAppointment.start_datetime),
        end_datetime: new Date(editingAppointment.end_datetime),
        patient_id: editingAppointment.patient_id,
        patient_name: editingAppointment.patient_name || '',
        patient_email: editingAppointment.patient_email || '',
        patient_phone: editingAppointment.patient_phone || '',
        send_email_reminder: editingAppointment.send_email_reminder,
        send_whatsapp_reminder: editingAppointment.send_whatsapp_reminder,
        send_immediate_reminder: false,
        notes: editingAppointment.notes || '',
      });
      setCurrentStep(0); // Reset to first step
    } else {
      console.log('🔄 Reinitializing form data for new appointment');
      setFormData(initialData);
      setCurrentStep(0);
    }
  }, [editingAppointment]);

  const updateFormData = (newData: Partial<AppointmentWizardData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...newData };
      
      // Auto-calculate end time based on session duration when start time changes
      if (newData.start_datetime && settings?.session_duration) {
        updated.end_datetime = addMinutes(newData.start_datetime, settings.session_duration);
      }
      
      return updated;
    });
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const resetWizard = () => {
    console.log('🔄 Resetting wizard');
    setCurrentStep(0);
    setFormData(initialData);
    setIsSubmittingAppointment(false);
  };

  const validateFormData = (): string | null => {
    console.log('🔍 Validating form data:', formData);
    
    if (!user?.id) {
      return 'Usuário não autenticado';
    }

    if (!formData.title.trim()) {
      return 'Título é obrigatório';
    }

    if (!formData.start_datetime || !formData.end_datetime) {
      return 'Data e horário são obrigatórios';
    }

    if (formData.start_datetime >= formData.end_datetime) {
      return 'Horário de fim deve ser posterior ao horário de início';
    }

    return null;
  };

  const submitAppointment = async (): Promise<boolean> => {
    try {
      setIsSubmittingAppointment(true);
      console.log('🚀 Starting appointment submission...');
      
      // Validar dados antes de enviar
      const validationError = validateFormData();
      if (validationError) {
        console.error('❌ Validation error:', validationError);
        toast.error(validationError);
        return false;
      }

      console.log('✅ Validation passed, preparing appointment data...');

      const appointmentData = {
        user_id: user!.id,
        title: formData.title,
        start_datetime: formData.start_datetime.toISOString(),
        end_datetime: formData.end_datetime.toISOString(),
        patient_id: formData.patient_id || null,
        patient_name: formData.patient_name?.trim() || null,
        patient_email: formData.patient_email?.trim() || null,
        patient_phone: formData.patient_phone?.trim() || null,
        send_email_reminder: formData.send_email_reminder,
        send_whatsapp_reminder: formData.send_whatsapp_reminder,
        status: 'scheduled' as const,
        notes: formData.notes?.trim() || null,
      };

      console.log('📤 Sending appointment data to API:', appointmentData);

      let appointmentResult: any;
      if (editingAppointment) {
        // Atualizar agendamento existente
        console.log('🔄 Updating existing appointment with ID:', editingAppointment.id);
        appointmentResult = await updateAppointmentAsync({ id: editingAppointment.id, ...appointmentData });
        console.log('✅ Appointment updated successfully:', appointmentResult);
      } else {
        // Criar novo agendamento
        console.log('🆕 Creating new appointment');
        appointmentResult = await createAppointmentAsync(appointmentData);
        console.log('✅ Appointment created successfully:', appointmentResult);
      }

      // As mutações já fazem invalidação automática, força refresh adicional
      console.log('🔄 Invalidating appointments cache after operation');
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });

      // Implementar lógica de lembrete imediato
      if (formData.send_immediate_reminder && (formData.patient_email || formData.patient_phone)) {
        console.log('📲 Enviando lembrete imediato para:', {
          email: formData.patient_email,
          phone: formData.patient_phone
        });
        
        try {
          // Chamar edge function para enviar lembretes de agendamento
          const { data: reminderResult, error: reminderError } = await supabase.functions.invoke('send-appointment-reminder', {
            body: {
              appointmentId: editingAppointment ? editingAppointment.id : appointmentResult?.id,
              reminderType: 'immediate'
            }
          });

          if (reminderError) {
            console.error('❌ Erro ao enviar lembrete imediato:', reminderError);
            toast.error(`Agendamento criado, mas falha no lembrete: ${reminderError.message}`);
          } else {
            console.log('✅ Lembrete imediato enviado com sucesso:', reminderResult);
            const { emailSent, whatsappSent } = reminderResult;
            
            if (emailSent && whatsappSent) {
              toast.success('Agendamento criado e lembretes enviados por email e WhatsApp!');
            } else if (emailSent) {
              toast.success('Agendamento criado e lembrete enviado por email!');
            } else if (whatsappSent) {
              toast.success('Agendamento criado e lembrete enviado por WhatsApp!');
            } else {
              toast.warning('Agendamento criado, mas nenhum lembrete foi enviado');
            }
          }
        } catch (reminderError: any) {
          console.error('❌ Erro inesperado ao enviar lembrete:', reminderError);
          toast.error(`Agendamento criado, mas falha no lembrete: ${reminderError.message}`);
        }
      }

      return true;

    } catch (error: any) {
      console.error('❌ Error creating appointment:', error);
      
      // Mostrar erro específico baseado no tipo
      if (error.message) {
        toast.error(`Erro ao criar agendamento: ${error.message}`);
      } else {
        toast.error('Erro ao criar agendamento. Tente novamente.');
      }
      
      return false;
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0: // Title step
        return formData.title.trim().length > 0;
      case 1: // Date/time step
        return !!(formData.start_datetime && formData.end_datetime && formData.start_datetime < formData.end_datetime);
      case 2: // Patient step (optional)
        return true;
      case 3: // Reminders step
        return true;
      case 4: // Summary step - sempre permitir confirmar
        return true;
      default:
        return false;
    }
  };

  const isLastStep = currentStep === 4; // Summary step
  const totalSteps = 5;

  return {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    resetWizard,
    submitAppointment,
    canProceedToNextStep,
    isLastStep,
    totalSteps,
    isSubmitting: isCreating || isUpdating || isSubmittingAppointment,
  };
};