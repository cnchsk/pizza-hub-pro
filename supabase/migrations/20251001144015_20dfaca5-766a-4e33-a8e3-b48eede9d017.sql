-- Add google_maps_api_key column to tenants table
ALTER TABLE public.tenants
ADD COLUMN google_maps_api_key TEXT;