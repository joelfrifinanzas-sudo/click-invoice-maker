-- Harden RLS for public.clients to restrict access to explicit company roles only
-- This preserves superadmin access and membership-based access for: owner, admin, manager, supervisor, cashier

begin;

-- Ensure RLS is enabled
alter table public.clients enable row level security;

-- Replace existing policies with stricter role-aware versions
drop policy if exists clients_select on public.clients;
drop policy if exists clients_insert on public.clients;
drop policy if exists clients_update on public.clients;
drop policy if exists clients_delete on public.clients;

-- Common predicate: superadmin OR member in allowed roles for the tenant
-- Note: explicit enum casts ensure correct typing
create policy clients_select on public.clients
for select
using (
  public.has_role(auth.uid(), 'superadmin') OR
  exists (
    select 1
    from public.user_company uc
    where uc.user_id = auth.uid()
      and uc.company_id = public.clients.tenant_id
      and uc.role in ('owner'::public.company_role,
                      'admin'::public.company_role,
                      'manager'::public.company_role,
                      'supervisor'::public.company_role,
                      'cashier'::public.company_role)
  )
);

create policy clients_insert on public.clients
for insert
with check (
  public.has_role(auth.uid(), 'superadmin') OR
  exists (
    select 1
    from public.user_company uc
    where uc.user_id = auth.uid()
      and uc.company_id = public.clients.tenant_id
      and uc.role in ('owner'::public.company_role,
                      'admin'::public.company_role,
                      'manager'::public.company_role,
                      'supervisor'::public.company_role,
                      'cashier'::public.company_role)
  )
);

create policy clients_update on public.clients
for update
using (
  public.has_role(auth.uid(), 'superadmin') OR
  exists (
    select 1
    from public.user_company uc
    where uc.user_id = auth.uid()
      and uc.company_id = public.clients.tenant_id
      and uc.role in ('owner'::public.company_role,
                      'admin'::public.company_role,
                      'manager'::public.company_role,
                      'supervisor'::public.company_role,
                      'cashier'::public.company_role)
  )
)
with check (
  public.has_role(auth.uid(), 'superadmin') OR
  exists (
    select 1
    from public.user_company uc
    where uc.user_id = auth.uid()
      and uc.company_id = public.clients.tenant_id
      and uc.role in ('owner'::public.company_role,
                      'admin'::public.company_role,
                      'manager'::public.company_role,
                      'supervisor'::public.company_role,
                      'cashier'::public.company_role)
  )
);

create policy clients_delete on public.clients
for delete
using (
  public.has_role(auth.uid(), 'superadmin') OR
  exists (
    select 1
    from public.user_company uc
    where uc.user_id = auth.uid()
      and uc.company_id = public.clients.tenant_id
      and uc.role in ('owner'::public.company_role,
                      'admin'::public.company_role,
                      'manager'::public.company_role,
                      'supervisor'::public.company_role,
                      'cashier'::public.company_role)
  )
);

commit;