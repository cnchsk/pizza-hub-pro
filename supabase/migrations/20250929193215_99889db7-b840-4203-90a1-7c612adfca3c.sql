-- Add images column to products table for multiple images
ALTER TABLE public.products 
ADD COLUMN images jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.images IS 'Array of image URLs (up to 6 images per product)';