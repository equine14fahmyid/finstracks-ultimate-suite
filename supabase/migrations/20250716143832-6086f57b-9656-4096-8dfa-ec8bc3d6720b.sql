
-- Add the missing modal_awal column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN modal_awal numeric DEFAULT 0;

-- Update existing records to have a default value
UPDATE public.user_settings 
SET modal_awal = 0 
WHERE modal_awal IS NULL;
