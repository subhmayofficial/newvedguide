-- Singleton: Bunny.net Storage zone + public CDN base (non-secrets). API password stays in env.

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_bunny_cdn_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  CONSTRAINT admin_bunny_cdn_settings_single_row CHECK (id = 1),
  storage_zone_name TEXT NOT NULL DEFAULT '',
  storage_region TEXT NOT NULL DEFAULT '',
  cdn_public_base_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_bunny_cdn_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_admin_bunny_cdn_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_bunny_cdn_settings_updated_at ON public.admin_bunny_cdn_settings;
CREATE TRIGGER trg_admin_bunny_cdn_settings_updated_at
  BEFORE UPDATE ON public.admin_bunny_cdn_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_bunny_cdn_settings_updated_at();

COMMIT;
