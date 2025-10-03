-- Adiciona colunas para configuração de meios de pagamento na tabela tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS payment_provider text,
ADD COLUMN IF NOT EXISTS payment_api_key text,
ADD COLUMN IF NOT EXISTS payment_api_secret text,
ADD COLUMN IF NOT EXISTS payment_merchant_id text;