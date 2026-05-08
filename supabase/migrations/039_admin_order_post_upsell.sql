create table if not exists public.admin_order_post_upsell (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kundli_points text,
  status text not null default 'pending',
  message_1_text text,
  message_1_scheduled_for timestamptz,
  message_1_sent_at timestamptz,
  message_2_text text,
  message_2_scheduled_for timestamptz,
  message_2_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id)
);

create index if not exists idx_admin_order_post_upsell_order_id
  on public.admin_order_post_upsell(order_id);

create index if not exists idx_admin_order_post_upsell_status
  on public.admin_order_post_upsell(status);

create or replace function public.set_admin_order_post_upsell_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_order_post_upsell_updated_at
on public.admin_order_post_upsell;

create trigger trg_admin_order_post_upsell_updated_at
before update on public.admin_order_post_upsell
for each row
execute function public.set_admin_order_post_upsell_updated_at();
