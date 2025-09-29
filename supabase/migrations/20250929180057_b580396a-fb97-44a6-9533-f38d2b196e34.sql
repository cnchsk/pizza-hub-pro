-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#D32F2F',
  secondary_color TEXT DEFAULT '#FF9800',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer', -- 'admin', 'customer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create product_variations table (sizes, borders, etc)
CREATE TABLE public.product_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_type TEXT NOT NULL, -- 'size', 'border', 'extra'
  name TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'preparing', 'delivering', 'completed', 'cancelled'
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variation_id UUID REFERENCES public.product_variations(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL, -- 'pix', 'credit_card', 'cash'
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  amount DECIMAL(10,2) NOT NULL,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create loyalty_tiers table
CREATE TABLE public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Bronze', 'Prata', 'Ouro'
  min_points INTEGER NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  benefits JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create loyalty_transactions table
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earn', 'redeem'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Create surveys table
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  csat_score INTEGER CHECK (csat_score >= 1 AND csat_score <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for tenants
CREATE POLICY "Tenants are viewable by authenticated users" ON public.tenants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tenants can be inserted by authenticated users" ON public.tenants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tenants can be updated by their admins" ON public.tenants
  FOR UPDATE USING (
    id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create RLS Policies for profiles
CREATE POLICY "Profiles are viewable by their owner" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Profiles can be inserted by authenticated users" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles can be updated by their owner" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Create RLS Policies for categories (tenant-isolated)
CREATE POLICY "Categories are viewable by all" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Categories can be managed by tenant admins" ON public.categories
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create RLS Policies for products (tenant-isolated)
CREATE POLICY "Products are viewable by all" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Products can be managed by tenant admins" ON public.products
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create RLS Policies for product_variations
CREATE POLICY "Product variations are viewable by all" ON public.product_variations
  FOR SELECT USING (true);

CREATE POLICY "Product variations can be managed by tenant admins" ON public.product_variations
  FOR ALL USING (
    product_id IN (
      SELECT id FROM public.products WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Create RLS Policies for orders (tenant-isolated)
CREATE POLICY "Orders are viewable by tenant admins and owners" ON public.orders
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "Orders can be created by authenticated users" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Orders can be updated by tenant admins" ON public.orders
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create RLS Policies for order_items
CREATE POLICY "Order items are viewable with order" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR user_id = auth.uid()
    )
  );

CREATE POLICY "Order items can be inserted with order" ON public.order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS Policies for payments
CREATE POLICY "Payments are viewable by tenant admins" ON public.payments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Payments can be inserted by authenticated users" ON public.payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS Policies for loyalty_tiers
CREATE POLICY "Loyalty tiers are viewable by all" ON public.loyalty_tiers
  FOR SELECT USING (true);

CREATE POLICY "Loyalty tiers can be managed by tenant admins" ON public.loyalty_tiers
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create RLS Policies for loyalty_transactions
CREATE POLICY "Loyalty transactions are viewable by tenant admins and owners" ON public.loyalty_transactions
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "Loyalty transactions can be inserted by authenticated users" ON public.loyalty_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS Policies for coupons
CREATE POLICY "Coupons are viewable by all" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Coupons can be managed by tenant admins" ON public.coupons
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create RLS Policies for surveys
CREATE POLICY "Surveys are viewable by tenant admins" ON public.surveys
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Surveys can be created by system" ON public.surveys
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS Policies for survey_responses
CREATE POLICY "Survey responses are viewable by tenant admins" ON public.survey_responses
  FOR SELECT USING (
    survey_id IN (
      SELECT id FROM public.surveys WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Survey responses can be created by anyone" ON public.survey_responses
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_categories_tenant_id ON public.categories(tenant_id);
CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate user loyalty points
CREATE OR REPLACE FUNCTION get_user_loyalty_points(p_user_id UUID, p_tenant_id UUID)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user loyalty tier
CREATE OR REPLACE FUNCTION get_user_loyalty_tier(p_user_id UUID, p_tenant_id UUID)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;