BEGIN;

CREATE TABLE IF NOT EXISTS admin_interakt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  language_code TEXT NOT NULL DEFAULT 'en',
  header_labels_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  body_labels_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  button_value_labels_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  button_payload_labels_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_name_required BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_interakt_templates_active
  ON admin_interakt_templates(is_active, created_at DESC);

CREATE OR REPLACE FUNCTION set_admin_interakt_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_interakt_templates_updated_at ON admin_interakt_templates;
CREATE TRIGGER trg_admin_interakt_templates_updated_at
BEFORE UPDATE ON admin_interakt_templates
FOR EACH ROW
EXECUTE FUNCTION set_admin_interakt_templates_updated_at();

COMMIT;
