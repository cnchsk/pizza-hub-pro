-- Fix infinite recursion in profiles RLS policy
DROP POLICY IF EXISTS "Profiles are viewable by their owner" ON public.profiles;

-- Create simpler policy without recursion
CREATE POLICY "Profiles are viewable by their owner" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Create separate policy for tenant admins
CREATE POLICY "Tenant admins can view all profiles in their tenant" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
    AND admin_profile.tenant_id = profiles.tenant_id
  )
);