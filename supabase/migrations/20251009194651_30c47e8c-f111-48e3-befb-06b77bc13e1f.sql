-- Adicionar campos específicos do Stripe na tabela tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT;