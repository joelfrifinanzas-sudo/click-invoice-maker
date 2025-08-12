-- Company-scoped roles via company_members with reusable RLS helpers (retry without IF NOT EXISTS)
begin;

-- 1) Table: company_members
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('SUPER_ADMIN','ADMIN','CAJERA','CLIENTE')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique(company_id, email)
);

-- Helpful indexes
create index if not exists idx_company_members_company_user on public.company_members(company_id, user_id);
create index if not exists idx_company_members_user on public.company_members(user_id);
create index if not exists idx_company_members_company_email on public.company_members(company_id, lower(email));

-- Enable RLS
alter table public.company_members enable row level security;

-- 2) Reusable membership helper functions
create or replace function public.is_company_member(_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members m
    where m.company_id = _company_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_company_admin(_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members m
    where m.company_id = _company_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('SUPER_ADMIN','ADMIN')
  );
$$;

-- 3) RLS policies for company_members
-- Drop then create to be idempotent
drop policy if exists "cmembers_select_same_company" on public.company_members;
drop policy if exists "cmembers_admin_insert" on public.company_members;
drop policy if exists "cmembers_admin_update" on public.company_members;
drop policy if exists "cmembers_admin_delete" on public.company_members;

-- Select: any active member of the same company
create policy "cmembers_select_same_company"
  on public.company_members
  for select
  using (public.is_company_member(company_id));

-- Insert: only SUPER_ADMIN/ADMIN of that company
create policy "cmembers_admin_insert"
  on public.company_members
  for insert
  with check (public.is_company_admin(company_id));

-- Update: only SUPER_ADMIN/ADMIN of that company
create policy "cmembers_admin_update"
  on public.company_members
  for update
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

-- Delete: only SUPER_ADMIN/ADMIN of that company
create policy "cmembers_admin_delete"
  on public.company_members
  for delete
  using (public.is_company_admin(company_id));

-- 4) Apply reusable condition to app tables with company_id

-- products: members can read; admins can write
drop policy if exists "cm_read_products" on public.products;
drop policy if exists "cm_insert_products_admin_only" on public.products;
drop policy if exists "cm_update_products_admin_only" on public.products;
drop policy if exists "cm_delete_products_admin_only" on public.products;

create policy "cm_read_products"
  on public.products
  for select
  using (public.is_company_member(company_id));

create policy "cm_insert_products_admin_only"
  on public.products
  for insert
  with check (public.is_company_admin(company_id));

create policy "cm_update_products_admin_only"
  on public.products
  for update
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

create policy "cm_delete_products_admin_only"
  on public.products
  for delete
  using (public.is_company_admin(company_id));

-- invoices: members can read
drop policy if exists "cm_read_invoices" on public.invoices;
create policy "cm_read_invoices"
  on public.invoices
  for select
  using (public.is_company_member(company_id));

-- cotizaciones: members can read
drop policy if exists "cm_read_cotizaciones" on public.cotizaciones;
create policy "cm_read_cotizaciones"
  on public.cotizaciones
  for select
  using (public.is_company_member(company_id));

-- empresa_cotizacion_config: members can read
drop policy if exists "cm_read_empresa_cotizacion_config" on public.empresa_cotizacion_config;
create policy "cm_read_empresa_cotizacion_config"
  on public.empresa_cotizacion_config
  for select
  using (public.is_company_member(company_id));

-- empresa_facturacion_config: members can read
drop policy if exists "cm_read_empresa_facturacion_config" on public.empresa_facturacion_config;
create policy "cm_read_empresa_facturacion_config"
  on public.empresa_facturacion_config
  for select
  using (public.is_company_member(company_id));

-- empresa_ncf_sequences: members can read
drop policy if exists "cm_read_empresa_ncf_sequences" on public.empresa_ncf_sequences;
create policy "cm_read_empresa_ncf_sequences"
  on public.empresa_ncf_sequences
  for select
  using (public.is_company_member(company_id));

-- customers: members can read
drop policy if exists "cm_read_customers" on public.customers;
create policy "cm_read_customers"
  on public.customers
  for select
  using (public.is_company_member(company_id));

-- audit_events: members can read their company's events (additional to existing)
drop policy if exists "cm_read_audit_events" on public.audit_events;
create policy "cm_read_audit_events"
  on public.audit_events
  for select
  using (public.is_company_member(company_id));

commit;