-- Remove address fields from profiles table (only customers need these)
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS neighborhood,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS postal_code,
DROP COLUMN IF EXISTS address_complement;