BEGIN;

-- Add new columns
ALTER TABLE kundli_reviews
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS rating INTEGER,
  ADD COLUMN IF NOT EXISTS most_useful_part TEXT,
  ADD COLUMN IF NOT EXISTS personalization_feedback TEXT,
  ADD COLUMN IF NOT EXISTS clarity_feedback TEXT,
  ADD COLUMN IF NOT EXISTS improvement_feedback TEXT,
  ADD COLUMN IF NOT EXISTS written_review TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Backfill from old columns (for any existing rows)
UPDATE kundli_reviews SET
  name = customer_name,
  rating = rating_overall,
  most_useful_part = COALESCE(NULLIF(favorite_part, ''), 'Overall clarity'),
  personalization_feedback = 'Kaafi had tak personalized lagi',
  clarity_feedback = 'Kaafi clear',
  improvement_feedback = COALESCE(NULLIF(improvements, ''), 'Sab theek tha'),
  written_review = testimonial,
  source = COALESCE(source_page, 'premium_kundli_review_form'),
  submitted_at = created_at
WHERE name IS NULL;

-- Make required columns NOT NULL
ALTER TABLE kundli_reviews
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN rating SET NOT NULL,
  ALTER COLUMN most_useful_part SET NOT NULL,
  ALTER COLUMN personalization_feedback SET NOT NULL,
  ALTER COLUMN clarity_feedback SET NOT NULL,
  ALTER COLUMN improvement_feedback SET NOT NULL,
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN submitted_at SET NOT NULL,
  ALTER COLUMN submitted_at SET DEFAULT NOW(),
  ADD CONSTRAINT kundli_reviews_rating_chk CHECK (rating BETWEEN 1 AND 5);

-- Drop old columns
ALTER TABLE kundli_reviews
  DROP COLUMN IF EXISTS customer_name,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS order_number,
  DROP COLUMN IF EXISTS rating_overall,
  DROP COLUMN IF EXISTS rating_accuracy,
  DROP COLUMN IF EXISTS rating_clarity,
  DROP COLUMN IF EXISTS rating_design,
  DROP COLUMN IF EXISTS favorite_part,
  DROP COLUMN IF EXISTS improvements,
  DROP COLUMN IF EXISTS recommend_score,
  DROP COLUMN IF EXISTS testimonial,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS source_page,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at;

-- Drop old trigger and recreate index
DROP TRIGGER IF EXISTS update_kundli_reviews_updated_at ON kundli_reviews;
DROP INDEX IF EXISTS idx_kundli_reviews_created_at;
CREATE INDEX IF NOT EXISTS idx_kundli_reviews_submitted_at ON kundli_reviews(submitted_at DESC);

-- Update the INSERT policy to remain on anon
DROP POLICY IF EXISTS anon_insert_kundli_reviews ON kundli_reviews;
CREATE POLICY anon_insert_kundli_reviews
  ON kundli_reviews
  FOR INSERT
  TO anon
  WITH CHECK (true);

COMMIT;
