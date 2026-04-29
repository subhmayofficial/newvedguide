-- Backfill/compat migration for existing support_requests tables
-- that may have been created with an older column set.

BEGIN;

ALTER TABLE IF EXISTS public.support_requests
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS problem TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS source_page TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.support_requests
SET
  full_name = COALESCE(NULLIF(full_name, ''), 'Unknown User'),
  email = COALESCE(NULLIF(email, ''), 'unknown@example.com'),
  subject = COALESCE(NULLIF(subject, ''), 'Support request'),
  problem = COALESCE(NULLIF(problem, ''), 'No details shared'),
  status = COALESCE(NULLIF(status, ''), 'new'),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE public.support_requests
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN subject SET NOT NULL,
  ALTER COLUMN problem SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.support_requests
  DROP CONSTRAINT IF EXISTS support_requests_status_check;

ALTER TABLE public.support_requests
  ADD CONSTRAINT support_requests_status_check
  CHECK (status IN ('new', 'in_progress', 'resolved'));

COMMIT;
