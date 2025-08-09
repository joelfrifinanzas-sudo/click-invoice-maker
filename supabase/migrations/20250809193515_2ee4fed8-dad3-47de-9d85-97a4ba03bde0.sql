-- Patch functions to set a safe search_path per linter
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.fn_calc_itbis(net numeric, rate numeric default 0.18)
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(net, 0) * coalesce(rate, 0.18)
$$;

create or replace function public.invoice_items_set_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.owner_user_id is null then
    select owner_user_id into new.owner_user_id from public.invoices where id = new.invoice_id;
  end if;
  return new;
end;
$$;

create or replace function public.payments_set_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.owner_user_id is null then
    select owner_user_id into new.owner_user_id from public.invoices where id = new.invoice_id;
  end if;
  return new;
end;
$$;
