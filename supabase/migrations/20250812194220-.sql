begin;

-- Remove broad public access to shared quotes to prevent scraping
DROP POLICY IF EXISTS public_select_shared ON public.cotizacion_items;
DROP POLICY IF EXISTS public_select_shared ON public.cotizaciones;

-- Create a secure function to fetch a single shared quote by its public_id
-- Returns a JSON object with items embedded and without company_id/customer_id
CREATE OR REPLACE FUNCTION public.cotizacion_public_get(_public_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE v jsonb; BEGIN
  SELECT 
    (to_jsonb(c) 
      - 'company_id' 
      - 'customer_id')
    || jsonb_build_object(
      'items', COALESCE((
        SELECT jsonb_agg(row_to_json(i))
        FROM public.cotizacion_items i
        WHERE i.cotizacion_id = c.id
      ), '[]'::jsonb)
    )
  INTO v
  FROM public.cotizaciones c
  WHERE c.public_id = _public_id
  LIMIT 1;

  RETURN COALESCE(v, '{}'::jsonb);
END; $$;

commit;