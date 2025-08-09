-- 1) Enum y tabla de auditoría
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_event_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.audit_event_type AS ENUM (
      'auth_login',
      'invoice_created',
      'invoice_updated',
      'invoice_canceled',
      'role_changed',
      'company_activated',
      'company_deactivated'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  company_id uuid,
  event_type public.audit_event_type NOT NULL,
  subject_id uuid,
  message text,
  details jsonb
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- RLS: Solo superadmin puede leer todo; (opcional) miembros de empresa ven su empresa
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_events' AND policyname='superadmin_select_all'
  ) THEN
    CREATE POLICY superadmin_select_all ON public.audit_events FOR SELECT USING (public.has_role(auth.uid(),'superadmin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_events' AND policyname='company_members_select'
  ) THEN
    CREATE POLICY company_members_select ON public.audit_events FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid() AND uc.company_id = audit_events.company_id
      )
    );
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON public.audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_company ON public.audit_events (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON public.audit_events (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON public.audit_events (event_type);

-- 2) Función para registrar eventos (sanitizada)
CREATE OR REPLACE FUNCTION public.audit_log(
  _event_type public.audit_event_type,
  _company_id uuid DEFAULT NULL,
  _subject_id uuid DEFAULT NULL,
  _message text DEFAULT NULL,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_details jsonb := COALESCE(_details, '{}'::jsonb) - 'token' - 'password' - 'secret' - 'apikey';
BEGIN
  INSERT INTO public.audit_events(user_id, company_id, event_type, subject_id, message, details)
  VALUES (auth.uid(), _company_id, _event_type, _subject_id, left(_message, 500), v_details);
END;
$$;

-- 3) RPC de listado con filtros para Super Admin
CREATE OR REPLACE FUNCTION public.su_audit_list(
  _company_id uuid DEFAULT NULL,
  _user_id uuid DEFAULT NULL,
  _event_type public.audit_event_type DEFAULT NULL,
  _from timestamptz DEFAULT NULL,
  _to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  user_id uuid,
  user_email text,
  user_name text,
  company_id uuid,
  company_name text,
  event_type public.audit_event_type,
  subject_id uuid,
  message text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT e.id, e.created_at, e.user_id, u.email as user_email, p.display_name as user_name,
         e.company_id, c.name as company_name, e.event_type, e.subject_id, e.message
  FROM public.audit_events e
  LEFT JOIN auth.users u ON u.id = e.user_id
  LEFT JOIN public.users_profiles p ON p.id = e.user_id
  LEFT JOIN public.companies c ON c.id = e.company_id
  WHERE public.has_role(auth.uid(),'superadmin')
    AND (_company_id IS NULL OR e.company_id = _company_id)
    AND (_user_id IS NULL OR e.user_id = _user_id)
    AND (_event_type IS NULL OR e.event_type = _event_type)
    AND (_from IS NULL OR e.created_at >= _from)
    AND (_to IS NULL OR e.created_at < _to)
  ORDER BY e.created_at DESC
  LIMIT 1000;
$$;

-- 4) Triggers en invoices
CREATE OR REPLACE FUNCTION public.audit_invoice_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.audit_log('invoice_created', NEW.company_id, NEW.id, 'Factura creada', jsonb_build_object('status', NEW.status, 'number', NEW.number));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_invoice_after_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.status = 'anulada' AND (OLD.status IS DISTINCT FROM 'anulada')) OR (NEW.canceled_at IS NOT NULL AND OLD.canceled_at IS DISTINCT FROM NEW.canceled_at) THEN
    PERFORM public.audit_log('invoice_canceled', NEW.company_id, NEW.id, 'Factura anulada', jsonb_build_object('prev_status', OLD.status, 'new_status', NEW.status));
  ELSE
    -- Log edición general
    IF (row(NEW.*) IS DISTINCT FROM row(OLD.*)) THEN
      PERFORM public.audit_log('invoice_updated', NEW.company_id, NEW.id, 'Factura actualizada', jsonb_build_object('prev_status', OLD.status, 'new_status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_invoices_insert') THEN
    CREATE TRIGGER trg_audit_invoices_insert
    AFTER INSERT ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.audit_invoice_after_insert();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_invoices_update') THEN
    CREATE TRIGGER trg_audit_invoices_update
    AFTER UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.audit_invoice_after_update();
  END IF;
END $$;

-- 5) Extender RPCs existentes para registrar cambios
CREATE OR REPLACE FUNCTION public.su_company_set_active(_company_id uuid, _active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.companies SET active = COALESCE(_active, active) WHERE id = _company_id;
  PERFORM public.audit_log(CASE WHEN _active THEN 'company_activated' ELSE 'company_deactivated' END::public.audit_event_type, _company_id, _company_id, CASE WHEN _active THEN 'Empresa activada' ELSE 'Empresa desactivada' END, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.su_company_set_member_role(
  _company_id uuid,
  _user_id uuid,
  _role public.company_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.user_company(company_id, user_id, role)
  VALUES (_company_id, _user_id, _role)
  ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  PERFORM public.audit_log('role_changed', _company_id, _user_id, 'Cambio de rol', jsonb_build_object('role', _role));
END;
$$;

CREATE OR REPLACE FUNCTION public.su_company_remove_member(
  _company_id uuid,
  _user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.user_company WHERE company_id = _company_id AND user_id = _user_id;
  PERFORM public.audit_log('role_changed', _company_id, _user_id, 'Miembro removido de la empresa', NULL);
END;
$$;