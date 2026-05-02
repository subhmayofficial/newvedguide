-- User starts in a lobby; billing/countdown begin only after an admin starts the consult.

DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname
  INTO cname
  FROM pg_constraint con
  WHERE con.conrelid = 'public.chat_sessions'::regclass
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%status%'
  LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.chat_sessions DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.chat_sessions
  ADD CONSTRAINT chat_sessions_status_check
  CHECK (status IN ('waiting_astrologer', 'open', 'closed'));

COMMENT ON COLUMN public.chat_sessions.status IS 'waiting_astrologer = lobby (no meter); open = live consult; closed = ended.';

-- Block end-users from changing session status (claim/start/close use service_role APIs).
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
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Session status is server-managed';
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

-- Realtime: user clients listen for status waiting_astrologer → open.
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
  END IF;
END $$;
