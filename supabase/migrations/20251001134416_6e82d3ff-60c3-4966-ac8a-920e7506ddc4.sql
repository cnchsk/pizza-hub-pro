-- Add delivery configuration fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_radius_km NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS free_delivery_min_order NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.tenants.delivery_fee IS 'Default delivery fee amount';
COMMENT ON COLUMN public.tenants.delivery_radius_km IS 'Maximum delivery radius in kilometers';
COMMENT ON COLUMN public.tenants.free_delivery_min_order IS 'Minimum order value for free delivery (null = no free delivery)';