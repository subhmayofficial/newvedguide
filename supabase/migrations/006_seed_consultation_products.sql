-- Seed consultation products for checkout/admin usage
-- Safe to run multiple times (upsert by slug)

BEGIN;

INSERT INTO products (
  name,
  slug,
  type,
  price,
  currency,
  is_active,
  delivery_type,
  delivery_eta_hours,
  metadata_json
)
VALUES
  (
    '15 Min Live Consultation',
    'consultation-15min',
    'consultation',
    149900,
    'INR',
    TRUE,
    'scheduled',
    24,
    '{"duration_minutes":15}'::jsonb
  ),
  (
    '45 Min Live Consultation',
    'consultation-45min',
    'consultation',
    499900,
    'INR',
    TRUE,
    'scheduled',
    24,
    '{"duration_minutes":45}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  is_active = EXCLUDED.is_active,
  delivery_type = EXCLUDED.delivery_type,
  delivery_eta_hours = EXCLUDED.delivery_eta_hours,
  metadata_json = COALESCE(products.metadata_json, '{}'::jsonb) || EXCLUDED.metadata_json,
  updated_at = NOW();

COMMIT;
