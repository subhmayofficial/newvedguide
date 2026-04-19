-- Saved HTML templates for SMTP test sends (admin)

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_smtp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL DEFAULT '',
  html TEXT NOT NULL DEFAULT '',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_smtp_templates_active
  ON public.admin_smtp_templates(is_active, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_admin_smtp_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_smtp_templates_updated_at ON public.admin_smtp_templates;
CREATE TRIGGER trg_admin_smtp_templates_updated_at
  BEFORE UPDATE ON public.admin_smtp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_smtp_templates_updated_at();

COMMIT;

