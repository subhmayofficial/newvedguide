-- Phone OTP challenges (WhatsApp via Interakt) + send audit for rate limits.
-- Service role only for writes; no RLS policies for anon/authenticated (deny by default).

CREATE TABLE IF NOT EXISTS public.phone_otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL UNIQUE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempt_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_challenges_expires_at
  ON public.phone_otp_challenges (expires_at);

DROP TRIGGER IF EXISTS trg_phone_otp_challenges_updated_at ON public.phone_otp_challenges;
CREATE TRIGGER trg_phone_otp_challenges_updated_at
  BEFORE UPDATE ON public.phone_otp_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.phone_otp_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_send_log_phone_created
  ON public.phone_otp_send_log (phone_e164, created_at DESC);

ALTER TABLE public.phone_otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_otp_send_log ENABLE ROW LEVEL SECURITY;

-- Resolve synthetic-email auth user for phone OTP bridge (server / service_role only).
CREATE OR REPLACE FUNCTION public.auth_user_id_for_phone_otp(p_email text, p_phone text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE lower(u.email) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.auth_user_id_for_phone_otp(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_id_for_phone_otp(text, text) TO service_role;
