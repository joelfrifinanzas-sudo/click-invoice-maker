-- Ensure views run with SECURITY INVOKER
ALTER VIEW public.v_invoice_totals SET (security_invoker = true);
ALTER VIEW public.v_cotizacion_totales SET (security_invoker = true);

-- cotizacion_send does not require elevated privileges; switch to invoker
CREATE OR REPLACE FUNCTION public.cotizacion_send(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
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