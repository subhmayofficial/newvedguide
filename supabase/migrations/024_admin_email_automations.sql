-- Admin-managed email automations (toggle + template mapping)

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_email_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  template_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_email_automations_key
  ON public.admin_email_automations (automation_key);

CREATE OR REPLACE FUNCTION public.set_admin_email_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_email_automations_updated_at ON public.admin_email_automations;
CREATE TRIGGER trg_admin_email_automations_updated_at
  BEFORE UPDATE ON public.admin_email_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_email_automations_updated_at();

INSERT INTO public.admin_email_automations (
  automation_key,
  label,
  description,
  is_enabled,
  template_name
)
VALUES (
  'kundli_order_confirmation',
  'Kundli order confirmation',
  'Auto-send confirmation email after successful paid-kundli payment.',
  TRUE,
  'kundli_order_confirmation'
)
ON CONFLICT (automation_key) DO NOTHING;

COMMIT;
