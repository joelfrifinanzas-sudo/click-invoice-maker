-- Create table public.clientes if missing
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  nombre text not null,
  email text,
  telefono text,
  cedula_rnc text,
  direccion text,
  notas text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_clientes_company_nombre on public.clientes(company_id, nombre);
create unique index if not exists idx_clientes_company_email_unique on public.clientes(company_id, email) where email is not null;

-- Enable RLS
alter table public.clientes enable row level security;
alter table public.clientes force row level security;

-- SELECT policy: active member of same company
do $$ begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'clientes' and p.policyname = 'clientes_select_member'
  ) then
    create policy "clientes_select_member"
      on public.clientes
      for select
      using (public.is_company_member(company_id));
  end if;
end $$;

-- INSERT policy: admin of same company
do $$ begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'clientes' and p.policyname = 'clientes_insert_admin'
  ) then
    create policy "clientes_insert_admin"
      on public.clientes
      for insert
      with check (public.is_company_admin(company_id));
  end if;
end $$;

-- UPDATE policy: admin of same company
do $$ begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'clientes' and p.policyname = 'clientes_update_admin'
  ) then
    create policy "clientes_update_admin"
      on public.clientes
      for update
      using (public.is_company_admin(company_id))
      with check (public.is_company_admin(company_id));
  end if;
end $$;

-- DELETE policy: admin of same company
do $$ begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'clientes' and p.policyname = 'clientes_delete_admin'
  ) then
    create policy "clientes_delete_admin"
      on public.clientes
      for delete
      using (public.is_company_admin(company_id));
  end if;
end $$;

-- OPTIONAL: allow CAJERA to update only nombre/telefono/direccion within same company
-- Helper function to ensure only allowed fields changed
create or replace function public.clientes_cajera_update_allowed(new_row public.clientes)
returns boolean
language plpgsql
security definer
stable
set search_path to 'public'
as $$
declare
  old_row public.clientes;
  v_old jsonb;
  v_new jsonb;
begin
  select c.* into old_row from public.clientes c where c.id = new_row.id;
  if not found then
    return false;
  end if;
  -- Compare everything except the allowed fields
  v_old := to_jsonb(old_row) - 'nombre' - 'telefono' - 'direccion';
  v_new := to_jsonb(new_row) - 'nombre' - 'telefono' - 'direccion';
  return v_old = v_new;
end;
$$;

-- Policy for CAJERA limited updates
do $$ begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'clientes' and p.policyname = 'clientes_update_cajera_limited'
  ) then
    create policy "clientes_update_cajera_limited"
      on public.clientes
      for update
      using (
        exists (
          select 1 from public.company_members m
          where m.company_id = clientes.company_id
            and m.user_id = auth.uid()
            and m.status = 'active'
            and lower(m.role) in ('cajera','cashier')
        )
      )
      with check (
        exists (
          select 1 from public.company_members m
          where m.company_id = clientes.company_id
            and m.user_id = auth.uid()
            and m.status = 'active'
            and lower(m.role) in ('cajera','cashier')
        )
        and public.clientes_cajera_update_allowed(clientes)
      );
  end if;
end $$;