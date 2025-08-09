-- Create per-type NCF sequences per company
CREATE TABLE IF NOT EXISTS public.empresa_ncf_sequences (
  company_id uuid NOT NULL,
  ncf_type text NOT NULL,
  next_seq bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT empresa_ncf_sequences_pkey PRIMARY KEY (company_id, ncf_type)
);

-- Enable RLS and add company-scoped policies
ALTER TABLE public.empresa_ncf_sequences ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'empresa_ncf_sequences' AND policyname = 'company_read_write'
  ) THEN
    CREATE POLICY "company_read_write"
    ON public.empresa_ncf_sequences
    USING (EXISTS (
      SELECT 1 FROM public.user_company uc
      WHERE uc.company_id = empresa_ncf_sequences.company_id AND uc.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.user_company uc
      WHERE uc.company_id = empresa_ncf_sequences.company_id AND uc.user_id = auth.uid()
    ));
  END IF;
END $$;

-- Trigger to maintain updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_empresa_ncf_sequences_updated_at'
  ) THEN
    CREATE TRIGGER set_empresa_ncf_sequences_updated_at
    BEFORE UPDATE ON public.empresa_ncf_sequences
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Function to get and advance the next NCF for a company and type
CREATE OR REPLACE FUNCTION public.next_ncf(_company_id uuid, _ncf_type text)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_seq bigint;
BEGIN
  -- Ensure row exists
  INSERT INTO public.empresa_ncf_sequences(company_id, ncf_type)
  VALUES (_company_id, _ncf_type)
  ON CONFLICT (company_id, ncf_type) DO NOTHING;

  -- Advance atomically and return the new value
  UPDATE public.empresa_ncf_sequences
  SET next_seq = next_seq + 1
  WHERE company_id = _company_id AND ncf_type = _ncf_type
  RETURNING next_seq INTO v_seq;

  RETURN _ncf_type || lpad(v_seq::text, 8, '0');
END;
$$;

-- Function to assign (reserve) an NCF to an invoice, only if not already assigned
CREATE OR REPLACE FUNCTION public.assign_invoice_ncf(_invoice_id uuid, _ncf_type text)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
  v_seq bigint;
  v_ncf text;
BEGIN
  SELECT company_id INTO v_company FROM public.invoices WHERE id = _invoice_id;
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  -- If already has NCF, return it
  SELECT ncf INTO v_ncf FROM public.invoices WHERE id = _invoice_id;
  IF v_ncf IS NOT NULL THEN
    RETURN v_ncf;
  END IF;

  -- Ensure sequence row exists
  INSERT INTO public.empresa_ncf_sequences(company_id, ncf_type)
  VALUES (v_company, _ncf_type)
  ON CONFLICT (company_id, ncf_type) DO NOTHING;

  -- Advance sequence
  UPDATE public.empresa_ncf_sequences
  SET next_seq = next_seq + 1
  WHERE company_id = v_company AND ncf_type = _ncf_type
  RETURNING next_seq INTO v_seq;

  v_ncf := _ncf_type || lpad(v_seq::text, 8, '0');

  -- Assign to invoice
  UPDATE public.invoices
  SET ncf = v_ncf, ncf_sequence = v_seq
  WHERE id = _invoice_id;

  RETURN v_ncf;
END;
$$;

-- Ensure NCF uniqueness per company
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_company_ncf
ON public.invoices (company_id, ncf)
WHERE ncf IS NOT NULL;