-- Adicionar coluna para indicar modo teste do Mercado Pago
ALTER TABLE public.tenants 
ADD COLUMN mercadopago_test_mode boolean DEFAULT true;