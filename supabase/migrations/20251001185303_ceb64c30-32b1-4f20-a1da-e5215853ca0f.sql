-- Phase 1: Survey Response Security
-- Drop the overly permissive policy that allows anyone to insert
DROP POLICY IF EXISTS "Survey responses can be created by anyone" ON public.survey_responses;

-- Create a more secure policy requiring authentication
CREATE POLICY "Survey responses can be created by authenticated users"
ON public.survey_responses
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Add unique constraint to prevent multiple responses per order
ALTER TABLE public.survey_responses
ADD CONSTRAINT survey_responses_survey_id_unique UNIQUE (survey_id);

-- Phase 2: Database Function Security Hardening
-- Update get_user_loyalty_points function
CREATE OR REPLACE FUNCTION public.get_user_loyalty_points(p_user_id uuid, p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  total_points INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'earn' THEN points
      WHEN transaction_type = 'redeem' THEN -points
      ELSE 0
    END
  ), 0) INTO total_points
  FROM public.loyalty_transactions
  WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  
  RETURN total_points;
END;
$function$;

-- Update get_user_loyalty_tier function
CREATE OR REPLACE FUNCTION public.get_user_loyalty_tier(p_user_id uuid, p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_points INTEGER;
  tier_name TEXT;
BEGIN
  user_points := get_user_loyalty_points(p_user_id, p_tenant_id);
  
  SELECT name INTO tier_name
  FROM public.loyalty_tiers
  WHERE tenant_id = p_tenant_id AND min_points <= user_points
  ORDER BY min_points DESC
  LIMIT 1;
  
  RETURN COALESCE(tier_name, 'Bronze');
END;
$function$;

-- Update validate_coupon_code function
CREATE OR REPLACE FUNCTION public.validate_coupon_code(p_code text, p_tenant_id uuid, p_order_amount numeric)
RETURNS TABLE(id uuid, code text, discount_type text, discount_value numeric, is_valid boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;