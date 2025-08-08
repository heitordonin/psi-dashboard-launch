-- Adicionar foreign keys para appointments table

-- FK para user_id -> profiles.id
ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- FK para patient_id -> patients.id (opcional, pois patient_id pode ser NULL)
ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;