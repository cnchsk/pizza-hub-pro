-- Create subscriptions table to track tenant subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Tenant admins can view their own subscription
CREATE POLICY "Tenant admins can view their subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- System can manage subscriptions
CREATE POLICY "System can manage subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if tenant has active subscription or is in trial
CREATE OR REPLACE FUNCTION public.check_tenant_subscription_status(p_tenant_id UUID)
RETURNS TABLE(
  is_active BOOLEAN,
  status TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s.status IN ('active', 'trialing') THEN true
      WHEN s.status = 'trialing' AND s.trial_ends_at > now() THEN true
      ELSE false
    END as is_active,
    s.status,
    s.trial_ends_at
  FROM public.subscriptions s
  WHERE s.tenant_id = p_tenant_id
  LIMIT 1;
END;
$$;