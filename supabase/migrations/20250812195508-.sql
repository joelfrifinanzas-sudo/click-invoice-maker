begin;

-- CLIENTS: ensure required columns and owner-based RLS
alter table public.clients enable row level security;
alter table public.clients alter column id set default gen_random_uuid();
alter table public.clients alter column created_at set default now();
alter table public.clients add column if not exists owner_id uuid;

-- Trigger to set owner_id on insert to the current user
create or replace function public.clients_set_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clients_set_owner on public.clients;
create trigger trg_clients_set_owner
before insert on public.clients
for each row execute function public.clients_set_owner();

-- Replace existing RLS policies with owner-only access
DROP POLICY IF EXISTS clients_select ON public.clients;
DROP POLICY IF EXISTS clients_insert ON public.clients;
DROP POLICY IF EXISTS clients_update ON public.clients;
-- keep delete as-is if any; scope only asked for S/I/U

CREATE POLICY clients_select ON public.clients
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY clients_insert ON public.clients
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY clients_update ON public.clients
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Optional: unique email per owner (case-insensitive), ignoring nulls
CREATE UNIQUE INDEX IF NOT EXISTS ux_clients_owner_email
ON public.clients (owner_id, lower(email))
WHERE email IS NOT NULL;


-- PRODUCTS: ensure columns and owner-based RLS (without breaking existing owner_user_id usage)
alter table public.products enable row level security;
alter table public.products alter column id set default gen_random_uuid();
alter table public.products alter column created_at set default now();

-- Add a generated owner_id column mapped from existing owner_user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN owner_id uuid GENERATED ALWAYS AS (owner_user_id) STORED;
  END IF;
END $$;

-- Replace company-wide policies with owner-only
DROP POLICY IF EXISTS "Products owner can select" ON public.products;
DROP POLICY IF EXISTS "Products owner can insert" ON public.products;
DROP POLICY IF EXISTS "Products owner can update" ON public.products;
-- keep existing delete policy if present; scope is S/I/U
DROP POLICY IF EXISTS company_read_write ON public.products;

CREATE POLICY products_select ON public.products
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY products_insert ON public.products
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY products_update ON public.products
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Optional: unique SKU per owner, ignoring nulls
CREATE UNIQUE INDEX IF NOT EXISTS ux_products_owner_sku
ON public.products (owner_id, sku)
WHERE sku IS NOT NULL;

commit;