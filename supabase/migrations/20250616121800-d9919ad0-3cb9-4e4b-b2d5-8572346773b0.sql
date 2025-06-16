
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_full_name TEXT;
  user_cpf TEXT;
  user_phone_number TEXT;
  user_display_name TEXT;
BEGIN
  -- Defensive check for null metadata
  IF NEW.raw_user_meta_data IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Extract data from raw_user_meta_data using the new key
  user_full_name := NEW.raw_user_meta_data ->> 'full_name';
  user_cpf := NEW.raw_user_meta_data ->> 'cpf';
  user_phone_number := NEW.raw_user_meta_data ->> 'phone_number';
  
  -- Generate display_name from first name (first word of full_name)
  IF user_full_name IS NOT NULL THEN
    user_display_name := SPLIT_PART(user_full_name, ' ', 1);
  END IF;

  -- Insert with the corrected phone variable
  INSERT INTO public.profiles (
    id, full_name, cpf, phone, display_name, birth_date, crp_number, nit_nis_pis, updated_at
  )
  VALUES (
    NEW.id, user_full_name, user_cpf, user_phone_number, user_display_name, NULL, NULL, NULL, now()
  );
  
  RETURN NEW;
END;
$function$;
