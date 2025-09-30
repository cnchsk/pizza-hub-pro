-- Fix RLS policies for coupons table to protect discount codes and marketing strategy
-- First, drop ALL existing policies to ensure clean state

DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'coupons' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.coupons', pol.policyname);
    END LOOP;
END $$;

-- Create restricted SELECT policy - only authenticated users can view coupons for their tenant
CREATE POLICY "Coupons viewable by authenticated tenant users"
ON public.coupons
FOR SELECT
TO authenticated
USING (
  -- User must be from the same tenant
  tenant_id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
  AND is_active = true
);

-- Admin management policy - tenant admins can manage their coupons
CREATE POLICY "Tenant admins can manage coupons"
ON public.coupons
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create a security definer function for validating coupons during checkout
-- This allows controlled access to check if a specific coupon code is valid without exposing all coupons
CREATE OR REPLACE FUNCTION public.validate_coupon_code(
  p_code TEXT,
  p_tenant_id UUID,
  p_order_amount NUMERIC
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  is_valid BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE coupons.code = p_code
    AND coupons.tenant_id = p_tenant_id
    AND coupons.is_active = true;

  -- If coupon not found
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      p_code,
      NULL::TEXT,
      NULL::NUMERIC,
      FALSE,
      'Invalid coupon code'::TEXT;
    RETURN;
  END IF;

  -- Check if expired
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN QUERY SELECT 
      v_coupon.id,
      v_coupon.code,
      v_coupon.discount_type,
      v_coupon.discount_value,
      FALSE,
      'Coupon has expired'::TEXT;
    RETURN;
  END IF;

  -- Check if max uses reached
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT 
      v_coupon.id,
      v_coupon.code,
      v_coupon.discount_type,
      v_coupon.discount_value,
      FALSE,
      'Coupon usage limit reached'::TEXT;
    RETURN;
  END IF;

  -- Check minimum order amount
  IF v_coupon.min_order_amount IS NOT NULL AND p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT 
      v_coupon.id,
      v_coupon.code,
      v_coupon.discount_type,
      v_coupon.discount_value,
      FALSE,
      'Order amount does not meet minimum requirement'::TEXT;
    RETURN;
  END IF;

  -- Coupon is valid
  RETURN QUERY SELECT 
    v_coupon.id,
    v_coupon.code,
    v_coupon.discount_type,
    v_coupon.discount_value,
    TRUE,
    'Coupon is valid'::TEXT;
END;
$$;

-- Add comment explaining security approach
COMMENT ON TABLE public.coupons IS 'Contains sensitive discount codes and marketing strategy. RLS restricts viewing to authenticated users. Use validate_coupon_code() function for secure coupon validation during checkout.';

COMMENT ON FUNCTION public.validate_coupon_code IS 'Securely validates a coupon code without exposing all coupons. Checks expiration, usage limits, and minimum order requirements.';