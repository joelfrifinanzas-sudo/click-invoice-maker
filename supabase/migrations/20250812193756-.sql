-- Harden RLS for public.clients without relying on company_role enum literals
-- Allow only superadmins, or users whose global role resolves to admin/cajera and who are members of the tenant

begin;

alter table public.clients enable row level security;

drop policy if exists clients_select on public.clients;
drop policy if exists clients_insert on public.clients;
drop policy if exists clients_update on public.clients;
drop policy if exists clients_delete on public.clients;

create policy clients_select on public.clients
for select
using (
  public.has_role(auth.uid(), 'superadmin') OR (
    public.compute_global_role(auth.uid()) in ('admin'::public.global_role, 'cajera'::public.global_role)
    and exists (
      select 1 from public.user_company uc
      where uc.user_id = auth.uid()
        and uc.company_id = public.clients.tenant_id
    )
  )
);

create policy clients_insert on public.clients
for insert
with check (
  public.has_role(auth.uid(), 'superadmin') OR (
    public.compute_global_role(auth.uid()) in ('admin'::public.global_role, 'cajera'::public.global_role)
    and exists (
      select 1 from public.user_company uc
      where uc.user_id = auth.uid()
        and uc.company_id = public.clients.tenant_id
    )
  )
);

create policy clients_update on public.clients
for update
using (
  public.has_role(auth.uid(), 'superadmin') OR (
    public.compute_global_role(auth.uid()) in ('admin'::public.global_role, 'cajera'::public.global_role)
    and exists (
      select 1 from public.user_company uc
      where uc.user_id = auth.uid()
        and uc.company_id = public.clients.tenant_id
    )
  )
)
with check (
  public.has_role(auth.uid(), 'superadmin') OR (
    public.compute_global_role(auth.uid()) in ('admin'::public.global_role, 'cajera'::public.global_role)
    and exists (
      select 1 from public.user_company uc
      where uc.user_id = auth.uid()
        and uc.company_id = public.clients.tenant_id
    )
  )
);

create policy clients_delete on public.clients
for delete
using (
  public.has_role(auth.uid(), 'superadmin') OR (
    public.compute_global_role(auth.uid()) in ('admin'::public.global_role, 'cajera'::public.global_role)
    and exists (
      select 1 from public.user_company uc
      where uc.user_id = auth.uid()
        and uc.company_id = public.clients.tenant_id
    )
  )
);

commit;