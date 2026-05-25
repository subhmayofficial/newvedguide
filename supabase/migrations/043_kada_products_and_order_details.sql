-- ============================================================
-- VedGuide — Vedic Kada products + physical order details
-- ============================================================

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
    'Astrological Vedic Kada — Silver Plated',
    'vedic-kada-plated',
    'physical',
    74900,
    'INR',
    true,
    'shipping',
    480,
    '{"category":"vedic_kada","variant":"plated","mrp_paise":159900}'::jsonb
  ),
  (
    'Astrological Vedic Kada — Pure Silver',
    'vedic-kada-pure-silver',
    'physical',
    449900,
    'INR',
    true,
    'shipping',
    480,
    '{"category":"vedic_kada","variant":"silver","mrp_paise":799900}'::jsonb
  ),
  (
    'Siddh Energisation — Vedic Kada',
    'kada-siddha-energisation',
    'addon',
    29900,
    'INR',
    true,
    'ritual',
    480,
    '{"category":"vedic_kada","addon":"siddha_energisation"}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  is_active = EXCLUDED.is_active,
  delivery_type = EXCLUDED.delivery_type,
  delivery_eta_hours = EXCLUDED.delivery_eta_hours,
  metadata_json = EXCLUDED.metadata_json,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS physical_order_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  product_family TEXT NOT NULL DEFAULT 'vedic_kada',
  variant TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  design TEXT NOT NULL,
  design_label TEXT NOT NULL,
  size_code TEXT NOT NULL,
  size_label TEXT NOT NULL,
  siddha_energisation BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method TEXT NOT NULL,
  prepaid_discount_amount NUMERIC(14, 0) NOT NULL DEFAULT 0,
  shipping_full_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address_line1 TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_pincode TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'India',
  estimated_delivery_days TEXT NOT NULL DEFAULT '15-20',
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT physical_order_details_variant_check CHECK (variant IN ('plated', 'silver')),
  CONSTRAINT physical_order_details_design_check CHECK (design IN ('classic', 'traditional', 'ornate')),
  CONSTRAINT physical_order_details_size_check CHECK (size_code IN ('S', 'M', 'L', 'XL')),
  CONSTRAINT physical_order_details_payment_method_check CHECK (payment_method IN ('cod', 'prepaid')),
  CONSTRAINT physical_order_details_pincode_check CHECK (shipping_pincode ~ '^[0-9]{6}$')
);

CREATE INDEX IF NOT EXISTS idx_physical_order_details_order_id
  ON physical_order_details(order_id);

CREATE INDEX IF NOT EXISTS idx_physical_order_details_product_family
  ON physical_order_details(product_family);

DROP TRIGGER IF EXISTS update_physical_order_details_updated_at ON physical_order_details;
CREATE TRIGGER update_physical_order_details_updated_at
  BEFORE UPDATE ON physical_order_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

