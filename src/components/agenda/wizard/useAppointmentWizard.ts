import { useState } from 'react';
import { AppointmentWizardData } from '@/types/appointment';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { useAgendaSettings } from '@/hooks/useAgendaSettings';
import { addMinutes } from 'date-fns';

const initialData: AppointmentWizardData = {
  title: '',
  start_datetime: new Date(),
  end_datetime: new Date(),
  send_email_reminder: false,
  send_whatsapp_reminder: false,
};

export const useAppointmentWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AppointmentWizardData>(initialData);
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
  };

  const submitAppointment = () => {
    if (!user?.id) return;

    const appointmentData = {
      user_id: user.id,
      title: formData.title,
      start_datetime: formData.start_datetime.toISOString(),
      end_datetime: formData.end_datetime.toISOString(),
      patient_id: formData.patient_id || null,
      patient_name: formData.patient_name || null,
      patient_email: formData.patient_email || null,
      patient_phone: formData.patient_phone || null,
      send_email_reminder: formData.send_email_reminder,
      send_whatsapp_reminder: formData.send_whatsapp_reminder,
      status: 'scheduled' as const,
      notes: formData.notes || null,
    };

    createAppointment(appointmentData);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0: // Title step
        return formData.title.trim().length > 0;
      case 1: // Date/time step
        return formData.start_datetime && formData.end_datetime;
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
    isSubmitting: isCreating,
  };
};