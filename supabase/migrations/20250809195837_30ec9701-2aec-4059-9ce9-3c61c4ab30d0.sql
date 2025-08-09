-- MP-08: Update v_invoice_totals to ensure ITBIS is added (not subtracted)
create or replace view public.v_invoice_totals as
select
  i.id as invoice_id,
  coalesce(sum(it.quantity * it.unit_price), 0)::numeric as net,
  coalesce(sum((it.quantity * it.unit_price) * coalesce(it.itbis_rate, i.itbis_rate)), 0)::numeric as itbis,
  (coalesce(sum(it.quantity * it.unit_price), 0)
   + coalesce(sum((it.quantity * it.unit_price) * coalesce(it.itbis_rate, i.itbis_rate)), 0))::numeric as total,
  i.currency
from public.invoices i
left join public.invoice_items it on it.invoice_id = i.id
group by i.id, i.currency;