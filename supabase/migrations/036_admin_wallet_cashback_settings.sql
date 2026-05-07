-- Singleton: wallet top-up cashback (percent bonus on credited amount), toggled from admin Settings.

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_wallet_cashback_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  CONSTRAINT admin_wallet_cashback_settings_single_row CHECK (id = 1),
  cashback_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  -- Whole-number percent 0–100 (e.g. 10 = 10% extra paise on top-up principal).
  cashback_percent INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT admin_wallet_cashback_percent_range CHECK (cashback_percent >= 0 AND cashback_percent <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_wallet_cashback_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_admin_wallet_cashback_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_wallet_cashback_settings_updated_at ON public.admin_wallet_cashback_settings;
CREATE TRIGGER trg_admin_wallet_cashback_settings_updated_at
  BEFORE UPDATE ON public.admin_wallet_cashback_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_wallet_cashback_settings_updated_at();

COMMIT;
