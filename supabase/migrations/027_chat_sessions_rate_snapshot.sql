-- Per-minute INR rate at session start (countdown / future billing).
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS rate_inr_per_min integer;

COMMENT ON COLUMN public.chat_sessions.rate_inr_per_min IS 'INR per minute snapshot when the session was created.';
