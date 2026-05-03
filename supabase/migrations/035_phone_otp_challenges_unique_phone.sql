-- Older DBs may have phone_otp_challenges without UNIQUE(phone_e164) because
-- CREATE TABLE IF NOT EXISTS skipped DDL. Dedupe and add constraint for PostgREST upserts / integrity.

-- Keep the newest row per phone; drop duplicates.
DELETE FROM public.phone_otp_challenges c
WHERE c.id IN (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY phone_e164 ORDER BY created_at DESC, id DESC
      ) AS rn
    FROM public.phone_otp_challenges
  ) t
  WHERE t.rn > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.phone_otp_challenges'::regclass
      AND conname = 'phone_otp_challenges_phone_e164_key'
  ) THEN
    ALTER TABLE public.phone_otp_challenges
      ADD CONSTRAINT phone_otp_challenges_phone_e164_key UNIQUE (phone_e164);
  END IF;
END $$;
