-- Add separate address fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

COMMENT ON COLUMN public.tenants.neighborhood IS 'Neighborhood/District';
COMMENT ON COLUMN public.tenants.city IS 'City';
COMMENT ON COLUMN public.tenants.state IS 'State/Province';
COMMENT ON COLUMN public.tenants.postal_code IS 'Postal/ZIP code';