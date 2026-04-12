CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value NUMERIC(14, 0) NOT NULL,
  min_order_amount NUMERIC(14, 0) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(14, 0),
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  applies_to_product_slug TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE orders
  ADD COLUMN coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  ADD COLUMN coupon_code TEXT,
  ADD COLUMN coupon_applied BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_orders_coupon_id ON orders(coupon_id);
CREATE INDEX idx_orders_coupon_code ON orders(coupon_code);
