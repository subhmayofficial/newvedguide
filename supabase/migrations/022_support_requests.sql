-- Public support requests submitted from /support page for admin follow-up.

BEGIN;

CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  problem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  source_page TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_created_at
  ON public.support_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_requests_status_created_at
  ON public.support_requests (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_support_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_requests_updated_at ON public.support_requests;
CREATE TRIGGER trg_support_requests_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_support_requests_updated_at();

COMMIT;
