-- Pro-rata wallet burn during live chat: last wall time we metered charges up to "now".
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS last_billed_at timestamptz;

UPDATE public.chat_sessions
SET last_billed_at = COALESCE(last_billed_at, created_at, now())
WHERE last_billed_at IS NULL;

COMMENT ON COLUMN public.chat_sessions.last_billed_at IS 'Last metering anchor; undeducted accrual = (now - last_billed_at) at rate.';

-- Extend guard: authenticated users cannot edit server-managed billing/countdown fields.
CREATE OR REPLACE FUNCTION public.chat_sessions_countdown_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF auth.role() = 'authenticated'
     AND (
       NEW.countdown_budget_seconds IS DISTINCT FROM OLD.countdown_budget_seconds
       OR NEW.countdown_started_at IS DISTINCT FROM OLD.countdown_started_at
       OR NEW.last_billed_at IS DISTINCT FROM OLD.last_billed_at
     ) THEN
    RAISE EXCEPTION 'Session billing fields are server-managed';
  END IF;
  RETURN NEW;
END;
$$;
