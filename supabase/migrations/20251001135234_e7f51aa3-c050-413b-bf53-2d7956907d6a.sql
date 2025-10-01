-- Add contact and address fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS mobile_phone TEXT;

COMMENT ON COLUMN public.tenants.address IS 'Complete address of the pizzeria';
COMMENT ON COLUMN public.tenants.phone IS 'Landline phone number';
COMMENT ON COLUMN public.tenants.mobile_phone IS 'Mobile/WhatsApp phone number';