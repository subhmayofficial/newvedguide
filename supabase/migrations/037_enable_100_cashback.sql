-- Enable 100% wallet top-up cashback (applies on amounts > ₹99).
-- Admin can change this later via the admin → Settings panel.

BEGIN;

UPDATE public.admin_wallet_cashback_settings
SET cashback_enabled = TRUE,
    cashback_percent = 100,
    updated_at       = NOW()
WHERE id = 1;

-- Safety: if the row was somehow missing, insert it enabled
INSERT INTO public.admin_wallet_cashback_settings (id, cashback_enabled, cashback_percent)
VALUES (1, TRUE, 100)
ON CONFLICT (id) DO UPDATE
  SET cashback_enabled = TRUE,
      cashback_percent = 100,
      updated_at       = NOW();

COMMIT;
