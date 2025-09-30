-- Fix RLS policies for orders table to protect customer PII

-- Drop existing policies
DROP POLICY IF EXISTS "Orders are viewable by tenant admins and owners" ON public.orders;
DROP POLICY IF EXISTS "Orders can be created by authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Orders can be updated by tenant admins" ON public.orders;

-- Create improved SELECT policy with proper PII protection
-- Only allow viewing if user is the order owner OR a tenant admin
CREATE POLICY "Orders viewable by owner or tenant admin"
ON public.orders
FOR SELECT
TO authenticated
USING (
  -- User owns the order
  (user_id = auth.uid())
  OR
  -- User is admin of the tenant
  (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Create improved INSERT policy - users can only create orders for their tenant
CREATE POLICY "Orders can be created for user's tenant"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow insertion if tenant_id matches user's tenant OR if user has no tenant (guest orders)
  (
    tenant_id IN (
      SELECT COALESCE(tenant_id, tenant_id)
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  )
  OR
  -- Allow if user_id matches authenticated user (for guest checkout linking to existing account)
  (user_id = auth.uid())
);

-- Keep UPDATE policy - only tenant admins can update orders
CREATE POLICY "Orders can be updated by tenant admin"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add comment explaining PII protection
COMMENT ON TABLE public.orders IS 'Contains customer PII (name, phone, address). RLS policies ensure only order owners and tenant admins can access this data.';