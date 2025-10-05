-- Add test mode flag for Mercado Pago to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS mercadopago_test_mode boolean DEFAULT true;