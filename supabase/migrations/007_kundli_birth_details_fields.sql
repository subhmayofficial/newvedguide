-- Ensure Kundli checkout required fields exist on birth_details
-- Safe to run multiple times.

ALTER TABLE birth_details
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS report_language TEXT;

-- Normalize stored values for consistent checks
UPDATE birth_details
SET gender = LOWER(gender)
WHERE gender IS NOT NULL
  AND gender <> LOWER(gender);

UPDATE birth_details
SET report_language = LOWER(report_language)
WHERE report_language IS NOT NULL
  AND report_language <> LOWER(report_language);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'birth_details_gender_chk'
  ) THEN
    ALTER TABLE birth_details
      ADD CONSTRAINT birth_details_gender_chk
      CHECK (gender IS NULL OR gender IN ('male', 'female'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'birth_details_report_language_chk'
  ) THEN
    ALTER TABLE birth_details
      ADD CONSTRAINT birth_details_report_language_chk
      CHECK (
        report_language IS NULL
        OR report_language IN ('hindi', 'english')
      );
  END IF;
END $$;

COMMENT ON COLUMN birth_details.gender IS 'Customer gender from paid kundli checkout: male | female';
COMMENT ON COLUMN birth_details.report_language IS 'Preferred report language from paid kundli checkout: hindi | english';
