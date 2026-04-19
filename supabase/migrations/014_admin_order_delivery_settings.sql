-- Singleton row for Interakt "manual deliver report" from admin orders + settings UI.

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_order_delivery_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  CONSTRAINT admin_order_delivery_settings_single_row CHECK (id = 1),
  interakt_template_name TEXT NOT NULL DEFAULT 'kundlireportdelivery_bt',
  interakt_template_language TEXT NOT NULL DEFAULT 'hi',
  interakt_button_index TEXT NOT NULL DEFAULT '0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_order_delivery_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_admin_order_delivery_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_order_delivery_settings_updated_at ON public.admin_order_delivery_settings;
CREATE TRIGGER trg_admin_order_delivery_settings_updated_at
  BEFORE UPDATE ON public.admin_order_delivery_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_order_delivery_settings_updated_at();

COMMIT;
