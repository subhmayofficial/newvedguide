-- Admin: optional scheduled WhatsApp delivery for paid kundli (report URL + time).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_schedule_customer_name text,
  ADD COLUMN IF NOT EXISTS delivery_schedule_report_url text;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_scheduled_due
  ON public.orders (delivery_scheduled_at)
  WHERE delivery_scheduled_at IS NOT NULL;
