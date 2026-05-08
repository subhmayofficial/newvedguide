alter table public.admin_order_post_upsell
  add column if not exists flow_started_at timestamptz;

update public.admin_order_post_upsell u
set flow_started_at = o.updated_at
from public.orders o
where u.order_id = o.id
  and u.flow_started_at is null
  and o.fulfillment_status = 'delivered';
