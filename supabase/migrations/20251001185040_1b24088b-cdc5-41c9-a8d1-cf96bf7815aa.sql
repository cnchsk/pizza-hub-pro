-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Tenants are viewable by authenticated users" ON public.tenants;

-- Create a secure policy that only allows users to view their own tenant's data
CREATE POLICY "Users can only view their own tenant"
ON public.tenants
FOR SELECT
USING (
  id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);