-- CTZ-03 (retry with fixes): Extra actions and client portal updates
-- 1) Add rejection reason column (idempotent)
ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS rechazo_motivo text;

-- 2) Public accept/reject RPCs (by public_id)
CREATE OR REPLACE FUNCTION public.cotizacion_public_accept(_public_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow transition enviada|vista -> aceptada
  UPDATE public.cotizaciones c
  SET estado = 'aceptada'
  WHERE c.public_id = _public_id
    AND c.estado IN ('enviada','vista');
END;
$$;

CREATE OR REPLACE FUNCTION public.cotizacion_public_reject(_public_id uuid, _motivo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.cotizaciones c
  SET estado = 'rechazada', rechazo_motivo = COALESCE(_motivo, '')
  WHERE c.public_id = _public_id
    AND c.estado IN ('enviada','vista');
END;
$$;

-- 3) Convert to invoice (auth required, enforce membership)
CREATE OR REPLACE FUNCTION public.cotizacion_convert_to_invoice(_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
  v_customer uuid;
  v_moneda text;
  v_itbis_rate numeric;
  v_vence date;
  v_invoice_id uuid;
BEGIN
  SELECT company_id, customer_id, moneda, itbis_rate, vence_el
    INTO v_company, v_customer, v_moneda, v_itbis_rate, v_vence
  FROM public.cotizaciones WHERE id = _id;

  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Cotización no existe';
  END IF;

  -- Enforce that caller belongs to company
  IF NOT EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.company_id = v_company AND uc.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Create invoice
  INSERT INTO public.invoices (owner_user_id, company_id, customer_id, issue_date, due_date, itbis_rate, status, currency)
  VALUES (auth.uid(), v_company, v_customer, CURRENT_DATE, v_vence, v_itbis_rate, 'draft', COALESCE(v_moneda, 'DOP'))
  RETURNING id INTO v_invoice_id;

  -- Copy items
  INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, itbis_rate, currency)
  SELECT v_invoice_id, i.product_id, i.nombre, i.qty, i.precio_unitario, i.itbis_rate, COALESCE(v_moneda, 'DOP')
  FROM public.cotizacion_items i
  WHERE i.cotizacion_id = _id;

  -- Update quote status -> facturada
  UPDATE public.cotizaciones SET estado = 'facturada' WHERE id = _id;

  RETURN v_invoice_id;
END;
$$;

-- 4) Duplicate quote (auth required)
CREATE OR REPLACE FUNCTION public.cotizacion_duplicate(_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_id uuid;
  v_company uuid;
BEGIN
  SELECT company_id INTO v_company FROM public.cotizaciones WHERE id = _id;
  IF v_company IS NULL THEN RAISE EXCEPTION 'Cotización no existe'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_company uc WHERE uc.company_id = v_company AND uc.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  INSERT INTO public.cotizaciones (company_id, customer_id, number, fecha, vence_el, moneda, itbis_rate, tipo_descuento, valor_descuento, notas, terminos, estado, total_neto, total_itbis, total)
  SELECT company_id, customer_id, NULL, CURRENT_DATE, vence_el, moneda, itbis_rate, tipo_descuento, valor_descuento, notas, terminos, 'borrador', 0, 0, 0
  FROM public.cotizaciones WHERE id = _id
  RETURNING id INTO v_new_id;

  INSERT INTO public.cotizacion_items (cotizacion_id, product_id, nombre, qty, precio_unitario, itbis_rate)
  SELECT v_new_id, product_id, nombre, qty, precio_unitario, itbis_rate
  FROM public.cotizacion_items WHERE cotizacion_id = _id;

  PERFORM public.cotizaciones_recalc_totals(v_new_id);
  RETURN v_new_id;
END;
$$;

-- 5) Daily cron: mark overdue (enviada|vista -> vencida)
CREATE OR REPLACE FUNCTION public.cotizaciones_mark_overdue()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.cotizaciones
  SET estado = 'vencida'
  WHERE estado IN ('enviada','vista')
    AND vence_el IS NOT NULL
    AND vence_el < CURRENT_DATE;
END;
$$;

-- Schedule cron at 03:00 daily if not exists
DO $$ BEGIN
  PERFORM 1 FROM cron.job WHERE jobname = 'cotizaciones-expire-daily';
  IF NOT FOUND THEN
    PERFORM cron.schedule('cotizaciones-expire-daily', '0 3 * * *', 'SELECT public.cotizaciones_mark_overdue();');
  END IF;
END $$;