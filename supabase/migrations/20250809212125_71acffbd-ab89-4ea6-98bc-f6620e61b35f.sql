-- CTZ-02: Public link support and view tracking for cotizaciones
-- 1) Add public_id for shareable links
ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS public_id uuid UNIQUE DEFAULT gen_random_uuid();

-- 2) Allow anonymous/public SELECT only for shared quotes (public_id not null)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cotizaciones' AND policyname='public_select_shared'
  ) THEN
    CREATE POLICY "public_select_shared" ON public.cotizaciones
      FOR SELECT
      TO public
      USING (public_id IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cotizacion_items' AND policyname='public_select_shared'
  ) THEN
    CREATE POLICY "public_select_shared" ON public.cotizacion_items
      FOR SELECT
      TO public
      USING (EXISTS (
        SELECT 1 FROM public.cotizaciones c 
        WHERE c.id = cotizacion_items.cotizacion_id AND c.public_id IS NOT NULL
      ));
  END IF;
END $$;

-- 3) RPC function to mark quote as viewed (enviada -> vista) without requiring auth
--    SECURITY DEFINER to bypass RLS, but with strict, safe update
CREATE OR REPLACE FUNCTION public.cotizacion_mark_viewed(_public_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.cotizaciones c
  SET estado = 'vista'
  WHERE c.public_id = _public_id
    AND c.estado = 'enviada';
END;
$$;

-- 4) Ensure "Guardar y enviar" can set estado and generate number/public_id in one step if needed
CREATE OR REPLACE FUNCTION public.cotizacion_send(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
BEGIN
  SELECT company_id INTO v_company FROM public.cotizaciones WHERE id = _id;
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Cotización no existe';
  END IF;

  -- Assign number if missing
  UPDATE public.cotizaciones
  SET number = COALESCE(number, public.next_cotizacion_number(v_company)),
      estado = 'enviada'
  WHERE id = _id;
END;
$$;