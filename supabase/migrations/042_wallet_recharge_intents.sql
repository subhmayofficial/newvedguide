-- Tracks Razorpay wallet recharge orders (production) for idempotent verify + credit.

CREATE TABLE IF NOT EXISTS public.wallet_recharge_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  principal_paise bigint NOT NULL CHECK (principal_paise > 0),
  razorpay_order_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'settling', 'credited', 'failed')),
  razorpay_payment_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  credited_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_wallet_recharge_intents_user_created
  ON public.wallet_recharge_intents (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS wallet_recharge_intents_payment_id_key
  ON public.wallet_recharge_intents (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

COMMENT ON TABLE public.wallet_recharge_intents IS 'Razorpay wallet top-up intents; server claims row before crediting balance.';

ALTER TABLE public.wallet_recharge_intents ENABLE ROW LEVEL SECURITY;
