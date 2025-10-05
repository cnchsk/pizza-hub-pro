-- Adicionar coluna para armazenar o access token do Mercado Pago por tenant
ALTER TABLE public.tenants 
ADD COLUMN mercadopago_access_token text;