-- Adicionar colunas para rastreamento de pagamento
ALTER TABLE public.orders 
ADD COLUMN payment_id text,
ADD COLUMN payment_status text DEFAULT 'pending';

-- Adicionar índice para busca por payment_id
CREATE INDEX idx_orders_payment_id ON public.orders(payment_id);