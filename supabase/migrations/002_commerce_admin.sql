-- ============================================================
-- VedGuide — Commerce + Admin CRM (v2)
-- Renames legacy leads/orders; adds customers, products, leads,
-- birth_details, orders, order_items, payments, events, notes
-- ============================================================

BEGIN;

-- ── Rename legacy tables ─────────────────────────────────────
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

ALTER TABLE IF EXISTS leads RENAME TO legacy_leads;
ALTER TABLE IF EXISTS orders RENAME TO legacy_orders;

CREATE TRIGGER update_legacy_leads_updated_at
  BEFORE UPDATE ON legacy_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legacy_orders_updated_at
  BEFORE UPDATE ON legacy_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index names are schema-global; rename so new leads/orders can reuse names
ALTER INDEX IF EXISTS idx_leads_phone RENAME TO idx_legacy_leads_phone;
ALTER INDEX IF EXISTS idx_leads_created_at RENAME TO idx_legacy_leads_created_at;
ALTER INDEX IF EXISTS idx_leads_source RENAME TO idx_legacy_leads_source;
ALTER INDEX IF EXISTS idx_orders_payment_status RENAME TO idx_legacy_orders_payment_status;
ALTER INDEX IF EXISTS idx_orders_product_type RENAME TO idx_legacy_orders_product_type;
ALTER INDEX IF EXISTS idx_orders_razorpay_order RENAME TO idx_legacy_orders_razorpay_order;
ALTER INDEX IF EXISTS idx_orders_phone RENAME TO idx_legacy_orders_phone;
ALTER INDEX IF EXISTS idx_orders_created_at RENAME TO idx_legacy_orders_created_at;

-- Point free kundli submissions at new CRM leads (after created)
ALTER TABLE kundli_submissions DROP CONSTRAINT IF EXISTS kundli_submissions_lead_id_fkey;
UPDATE kundli_submissions SET lead_id = NULL;

-- ── New core tables ───────────────────────────────────────────

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  source_first TEXT,
  source_latest TEXT,
  utm_source_first TEXT,
  utm_medium_first TEXT,
  utm_campaign_first TEXT,
  utm_source_latest TEXT,
  utm_medium_latest TEXT,
  utm_campaign_latest TEXT,
  tags_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  price NUMERIC(14, 0) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_type TEXT,
  delivery_eta_hours INTEGER,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_type TEXT NOT NULL,
  status TEXT NOT NULL,
  journey_stage TEXT,
  source_page TEXT,
  entry_path TEXT,
  product_interest TEXT,
  form_name TEXT,
  has_order BOOLEAN NOT NULL DEFAULT FALSE,
  linked_order_id UUID,
  qualification_reason TEXT,
  conversion_reason TEXT,
  lost_reason TEXT,
  payload_json JSONB,
  utm_json JSONB,
  referrer TEXT,
  session_id TEXT,
  is_spam BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_lead_type ON leads(lead_type);
CREATE INDEX idx_leads_journey_stage ON leads(journey_stage);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

CREATE TABLE birth_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  full_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  time_of_birth TIME,
  birth_place TEXT,
  birth_city TEXT,
  birth_state TEXT,
  birth_country TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  timezone TEXT,
  birth_accuracy TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_birth_details_customer ON birth_details(customer_id);
CREATE INDEX idx_birth_details_lead ON birth_details(lead_id);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  birth_details_id UUID REFERENCES birth_details(id) ON DELETE SET NULL,
  source TEXT,
  entry_path TEXT,
  product_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  fulfillment_status TEXT NOT NULL,
  subtotal_amount NUMERIC(14, 0) NOT NULL DEFAULT 0,
  addon_amount NUMERIC(14, 0) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14, 0) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 0) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT,
  payment_initiated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_lead_id ON orders(lead_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_razorpay_order_id ON orders(razorpay_order_id);

ALTER TABLE leads
  ADD CONSTRAINT leads_linked_order_id_fkey
  FOREIGN KEY (linked_order_id) REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX idx_leads_linked_order_id ON leads(linked_order_id);

ALTER TABLE kundli_submissions
  ADD CONSTRAINT kundli_submissions_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  unit_price NUMERIC(14, 0) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(14, 0) NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  provider_signature TEXT,
  amount NUMERIC(14, 0) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  payment_method TEXT,
  raw_response_json JSONB,
  failure_reason TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_provider_order_id ON payments(provider_order_id);
CREATE INDEX idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_group TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  session_id TEXT,
  source_page TEXT,
  page_path TEXT,
  entry_path TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_event_name ON events(event_name);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_session_id ON events(session_id);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_birth_details_updated_at
  BEFORE UPDATE ON birth_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO products (name, slug, type, price, currency, is_active, delivery_type, delivery_eta_hours)
VALUES
  ('Personalized Kundli Report', 'paid-kundli', 'report', 39900, 'INR', TRUE, 'digital_pdf', 48),
  ('FastTrack 12h Delivery', 'fast-track-addon', 'addon', 9900, 'INR', TRUE, 'digital_pdf', 12)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE birth_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

COMMIT;
