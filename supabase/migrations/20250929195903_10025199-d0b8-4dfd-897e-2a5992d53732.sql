-- Migrate existing image_url to images array for products that don't have images yet
UPDATE public.products
SET images = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL 
  AND (images IS NULL OR images = '[]'::jsonb);