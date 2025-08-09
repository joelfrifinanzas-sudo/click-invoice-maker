-- MP-04: RLS Policies by company_id and user_company mapping

-- 1) Roles enum and mapping table
create type if not exists public.company_role as enum ('owner', 'member');

create table if not exists public.user_company (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

alter table public.user_company enable row level security;

-- Minimal RLS for user_company: users can read their memberships
-- (writes are handled via triggers/backfill; keep closed by default)
create policy if not exists "user_company_select_own"
  on public.user_company
  for select to authenticated
  using (auth.uid() = user_id);

-- Seed owners from existing companies
insert into public.user_company (company_id, user_id, role)
select c.id, c.owner_user_id, 'owner'::public.company_role
from public.companies c
on conflict (company_id, user_id) do nothing;

-- 2) Helper: add owner membership when a company is created
create or replace function public.add_owner_membership(_company_id uuid, _user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_company(company_id, user_id, role)
  values (_company_id, _user_id, 'owner')
  on conflict (company_id, user_id) do nothing;
end;
$$;

create or replace function public.companies_after_insert_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.add_owner_membership(new.id, new.owner_user_id);
  return new;
end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'companies_add_owner_membership'
  ) then
    create trigger companies_add_owner_membership
    after insert on public.companies
    for each row execute function public.companies_after_insert_membership();
  end if;
end $$;

-- 3) Company-based RLS policies (company_read_write)
-- Companies: membership-based access
create policy if not exists "company_read_write_companies"
  on public.companies
  for select to authenticated
  using (exists (
    select 1 from public.user_company uc
    where uc.company_id = companies.id and uc.user_id = auth.uid()
  ));

create policy if not exists "company_insert_companies"
  on public.companies
  for insert to authenticated
  with check (
    owner_user_id = auth.uid()
  );

create policy if not exists "company_update_companies"
  on public.companies
  for update to authenticated
  using (exists (
    select 1 from public.user_company uc
    where uc.company_id = companies.id and uc.user_id = auth.uid()
  ));

-- Customers: by company_id or company_id = auth.uid()::uuid fallback
create policy if not exists "company_read_write_customers_select"
  on public.customers
  for select to authenticated
  using (
    customers.company_id = auth.uid()::uuid
    or exists (
      select 1 from public.user_company uc
      where uc.company_id = customers.company_id and uc.user_id = auth.uid()
    )
  );

create policy if not exists "company_read_write_customers_insert"
  on public.customers
  for insert to authenticated
  with check (
    customers.company_id = auth.uid()::uuid
    or exists (
      select 1 from public.user_company uc
      where uc.company_id = customers.company_id and uc.user_id = auth.uid()
    )
  );

create policy if not exists "company_read_write_customers_update"
  on public.customers
  for update to authenticated
  using (
    customers.company_id = auth.uid()::uuid
    or exists (
      select 1 from public.user_company uc
      where uc.company_id = customers.company_id and uc.user_id = auth.uid()
    )
  );

-- Products
create policy if not exists "company_read_write_products_select"
  on public.products
  for select to authenticated
  using (
    products.company_id = auth.uid()::uuid
    or exists (
      select 1 from public.user_company uc
      where uc.company_id = products.company_id and uc.user_id = auth.uid()
    )
  );

create policy if not exists "company_read_write_products_insert"
  on public.products
  for insert to authenticated
  with check (
    products.company_id = auth.uid()::uuid
    or exists (
      select 1 from public.user_company uc
      where uc.company_id = products.company_id and uc.user_id = auth.uid()
    )
  );

create policy if not exists "company_read_write_products_update"
  on public.products
  for update to authenticated
  using (
    products.company_id = auth.uid()::uuid
    or exists (
      select 1 from public.user_company uc
      where uc.company_id = products.company_id and uc.user_id = auth.uid()
    )
  );

-- Invoices
create policy if not exists "company_read_write_invoices_select"
  on public.invoices
  for select to authenticated
  using (
    invoices.company_id = auth.uid()::uuid
    or exists (
      select 1 from public.user_company uc
      where uc.company_id = invoices.company_id and uc.user_id = auth.uid()
    )
  );

create policy if not exists "company_read_write_invoices_insert"
  on public.invoices
  for insert to authenticated
  with check (
    invoices.company_id = auth.uid()::uuid
    or exists (
      select 1 from public.user_company uc
      where uc.company_id = invoices.company_id and uc.user_id = auth.uid()
    )
  );

create policy if not exists "company_read_write_invoices_update"
  on public.invoices
  for update to authenticated
  using (
    invoices.company_id = auth.uid()::uuid
    or exists (
      select 1 from public.user_company uc
      where uc.company_id = invoices.company_id and uc.user_id = auth.uid()
    )
  );

-- Invoice items (via invoice)
create policy if not exists "company_read_write_invoice_items_select"
  on public.invoice_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.invoices i
      join public.user_company uc on uc.company_id = i.company_id and uc.user_id = auth.uid()
      where i.id = invoice_items.invoice_id
    )
    or exists (
      select 1 from public.invoices i2
      where i2.id = invoice_items.invoice_id and i2.company_id = auth.uid()::uuid
    )
  );

create policy if not exists "company_read_write_invoice_items_insert"
  on public.invoice_items
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.invoices i
      join public.user_company uc on uc.company_id = i.company_id and uc.user_id = auth.uid()
      where i.id = invoice_items.invoice_id
    )
    or exists (
      select 1 from public.invoices i2
      where i2.id = invoice_items.invoice_id and i2.company_id = auth.uid()::uuid
    )
  );

create policy if not exists "company_read_write_invoice_items_update"
  on public.invoice_items
  for update to authenticated
  using (
    exists (
      select 1
      from public.invoices i
      join public.user_company uc on uc.company_id = i.company_id and uc.user_id = auth.uid()
      where i.id = invoice_items.invoice_id
    )
    or exists (
      select 1 from public.invoices i2
      where i2.id = invoice_items.invoice_id and i2.company_id = auth.uid()::uuid
    )
  );

-- Payments (via invoice)
create policy if not exists "company_read_write_payments_select"
  on public.payments
  for select to authenticated
  using (
    exists (
      select 1
      from public.invoices i
      join public.user_company uc on uc.company_id = i.company_id and uc.user_id = auth.uid()
      where i.id = payments.invoice_id
    )
    or exists (
      select 1 from public.invoices i2
      where i2.id = payments.invoice_id and i2.company_id = auth.uid()::uuid
    )
  );

create policy if not exists "company_read_write_payments_insert"
  on public.payments
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.invoices i
      join public.user_company uc on uc.company_id = i.company_id and uc.user_id = auth.uid()
      where i.id = payments.invoice_id
    )
    or exists (
      select 1 from public.invoices i2
      where i2.id = payments.invoice_id and i2.company_id = auth.uid()::uuid
    )
  );

create policy if not exists "company_read_write_payments_update"
  on public.payments
  for update to authenticated
  using (
    exists (
      select 1
      from public.invoices i
      join public.user_company uc on uc.company_id = i.company_id and uc.user_id = auth.uid()
      where i.id = payments.invoice_id
    )
    or exists (
      select 1 from public.invoices i2
      where i2.id = payments.invoice_id and i2.company_id = auth.uid()::uuid
    )
  );
