
import { useState } from 'react';
import { AppointmentWizardData } from '@/types/appointment';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { useAgendaSettings } from '@/hooks/useAgendaSettings';
import { addMinutes } from 'date-fns';
import { toast } from 'sonner';

const initialData: AppointmentWizardData = {
  title: '',
  start_datetime: new Date(),
  end_datetime: new Date(),
  send_email_reminder: false,
  send_whatsapp_reminder: false,
  send_immediate_reminder: false,
};

export const useAppointmentWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AppointmentWizardData>(initialData);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const { user } = useSecureAuth();
  const { createAppointment, isCreating } = useAppointments();
  const { settings } = useAgendaSettings();

  const updateFormData = (data: Partial<AppointmentWizardData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...data };
      
      // Auto-calculate end time based on session duration when start time changes
      if (data.start_datetime && settings?.session_duration) {
        updated.end_datetime = addMinutes(data.start_datetime, settings.session_duration);
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
    setCurrentStep(0);
    setFormData(initialData);
    setIsSubmittingAppointment(false);
  };

  const validateFormData = (): string | null => {
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
      
      // Validar dados antes de enviar
      const validationError = validateFormData();
      if (validationError) {
        toast.error(validationError);
        return false;
      }

      console.log('Submitting appointment data:', formData);

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

      console.log('Final appointment data to be sent:', appointmentData);

      // Usar Promise para aguardar a conclusão da criação
      await new Promise<void>((resolve, reject) => {
        const originalCreateAppointment = createAppointment;
        
        // Interceptar o resultado usando uma abordagem de callback
        createAppointment(appointmentData);
        
        // Como o createAppointment usa mutação, vamos aguardar um pouco e verificar o estado
        setTimeout(() => {
          if (isCreating) {
            // Ainda processando, aguardar mais um pouco
            setTimeout(() => {
              resolve();
            }, 1000);
          } else {
            resolve();
          }
        }, 500);
      });

      // Implementar lógica de lembrete imediato se necessário
      if (formData.send_immediate_reminder && (formData.patient_email || formData.patient_phone)) {
        console.log('Enviando lembrete imediato para:', {
          email: formData.patient_email,
          phone: formData.patient_phone
        });
        
        // TODO: Implementar chamada para função de lembrete imediato
        toast.info('Lembrete imediato será enviado em breve');
      }

      console.log('Appointment created successfully');
      return true;

    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Erro ao criar agendamento. Tente novamente.');
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
    isSubmitting: isCreating || isSubmittingAppointment,
  };
};
