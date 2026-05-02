-- Chat sessions as user-visible "orders": reference code, close time, total billed.
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS order_code text,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_billed_paise bigint NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS chat_sessions_order_code_key
  ON public.chat_sessions (order_code)
  WHERE order_code IS NOT NULL;

COMMENT ON COLUMN public.chat_sessions.order_code IS 'Human-readable chat order id (e.g. VG-CH-…).';
COMMENT ON COLUMN public.chat_sessions.closed_at IS 'When the user ended the session.';
COMMENT ON COLUMN public.chat_sessions.total_billed_paise IS 'Sum of live_chat_meter charges for this session (set on close).';

UPDATE public.chat_sessions
SET order_code = 'VG-CH-' || upper(substr(replace(id::text, '-', ''), 1, 12))
WHERE order_code IS NULL;

CREATE OR REPLACE FUNCTION public.chat_session_set_order_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_code IS NULL OR trim(NEW.order_code) = '' THEN
    NEW.order_code := 'VG-CH-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 12));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_session_order_code ON public.chat_sessions;
CREATE TRIGGER trg_chat_session_order_code
  BEFORE INSERT ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.chat_session_set_order_code();

-- Server-managed order/billing fields (same pattern as countdown).
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
       OR NEW.order_code IS DISTINCT FROM OLD.order_code
       OR NEW.closed_at IS DISTINCT FROM OLD.closed_at
       OR NEW.total_billed_paise IS DISTINCT FROM OLD.total_billed_paise
     ) THEN
    RAISE EXCEPTION 'Session billing/order fields are server-managed';
  END IF;
  RETURN NEW;
END;
$$;
