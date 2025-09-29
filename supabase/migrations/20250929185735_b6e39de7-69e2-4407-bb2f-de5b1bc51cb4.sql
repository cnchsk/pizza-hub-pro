-- Remove all existing policies on profiles
DROP POLICY IF EXISTS "Profiles are viewable by their owner" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can view all profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be inserted by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by their owner" ON public.profiles;

-- Create security definer function to get user's own profile safely
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

-- Create simple policies without recursion
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

-- Update categories policies to use the security definer function
DROP POLICY IF EXISTS "Categories can be managed by tenant admins" ON public.categories;

CREATE POLICY "Categories can be managed by tenant admins" 
ON public.categories 
FOR ALL 
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Update products policies to use the security definer function
DROP POLICY IF EXISTS "Products can be managed by tenant admins" ON public.products;

CREATE POLICY "Products can be managed by tenant admins" 
ON public.products 
FOR ALL 
USING (tenant_id = public.get_user_tenant_id(auth.uid()));