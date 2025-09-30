-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customers are viewable by tenant admins
CREATE POLICY "Customers are viewable by tenant admins"
ON public.customers
FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Customers can be created by tenant admins
CREATE POLICY "Customers can be created by tenant admins"
ON public.customers
FOR INSERT
WITH CHECK (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Customers can be updated by tenant admins
CREATE POLICY "Customers can be updated by tenant admins"
ON public.customers
FOR UPDATE
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Customers can be deleted by tenant admins
CREATE POLICY "Customers can be deleted by tenant admins"
ON public.customers
FOR DELETE
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();