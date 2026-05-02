-- Authoritative countdown: budget seconds from a fixed server timestamp (survives refresh).
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS countdown_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS countdown_budget_seconds integer;

COMMENT ON COLUMN public.chat_sessions.countdown_started_at IS 'Wall-clock anchor for session countdown.';
COMMENT ON COLUMN public.chat_sessions.countdown_budget_seconds IS 'Seconds granted from anchor; remaining = budget - elapsed, capped by live wallet.';

-- End users must not tamper with countdown fields; only service_role (API) may adjust.
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
     ) THEN
    RAISE EXCEPTION 'Countdown fields are server-managed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_sessions_countdown_guard ON public.chat_sessions;
CREATE TRIGGER trg_chat_sessions_countdown_guard
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.chat_sessions_countdown_guard();
