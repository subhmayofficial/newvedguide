BEGIN;

CREATE TABLE IF NOT EXISTS kundli_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  order_number TEXT,
  rating_overall INTEGER NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_accuracy INTEGER NOT NULL CHECK (rating_accuracy BETWEEN 1 AND 5),
  rating_clarity INTEGER NOT NULL CHECK (rating_clarity BETWEEN 1 AND 5),
  rating_design INTEGER NOT NULL CHECK (rating_design BETWEEN 1 AND 5),
  favorite_part TEXT NOT NULL,
  improvements TEXT,
  recommend_score INTEGER NOT NULL CHECK (recommend_score BETWEEN 0 AND 10),
  testimonial TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source_page TEXT NOT NULL DEFAULT 'premium-kundli-review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kundli_reviews_created_at
  ON kundli_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kundli_reviews_status
  ON kundli_reviews(status);
CREATE INDEX IF NOT EXISTS idx_kundli_reviews_phone
  ON kundli_reviews(phone);

DROP TRIGGER IF EXISTS update_kundli_reviews_updated_at ON kundli_reviews;
CREATE TRIGGER update_kundli_reviews_updated_at
  BEFORE UPDATE ON kundli_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE kundli_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_insert_kundli_reviews ON kundli_reviews;
CREATE POLICY anon_insert_kundli_reviews
  ON kundli_reviews
  FOR INSERT
  TO anon
  WITH CHECK (true);

COMMIT;
