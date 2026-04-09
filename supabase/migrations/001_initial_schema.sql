-- ============================================================
-- VedGuide V1 — Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- LEADS
-- Captured at phone-input step (before full form submit)
-- ============================================================
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT,
  phone           TEXT NOT NULL,
  email           TEXT,
  source          TEXT,          -- 'free_kundli' | 'tool' | 'direct' | 'consultation'
  tool_slug       TEXT,          -- populated if lead came from a tool
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  referrer        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_phone       ON leads(phone);
CREATE INDEX idx_leads_created_at  ON leads(created_at DESC);
CREATE INDEX idx_leads_source      ON leads(source);

-- ============================================================
-- KUNDLI SUBMISSIONS
-- Full free kundli form submission with computed result
-- ============================================================
CREATE TABLE kundli_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  dob             DATE NOT NULL,
  tob             TIME NOT NULL,
  pob             TEXT NOT NULL,
  lat             DECIMAL(9,6),
  lon             DECIMAL(9,6),
  timezone        TEXT,
  result_data     JSONB,         -- computed kundli output (planets, houses, etc.)
  source          TEXT,          -- 'free_kundli_page' | 'tool_kundal_dhatu' | etc.
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kundli_phone      ON kundli_submissions(phone);
CREATE INDEX idx_kundli_lead_id    ON kundli_submissions(lead_id);
CREATE INDEX idx_kundli_created_at ON kundli_submissions(created_at DESC);

-- ============================================================
-- TOOL SUBMISSIONS
-- Each tool use captured with input + result
-- ============================================================
CREATE TABLE tool_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  tool_slug       TEXT NOT NULL,   -- 'kundal-dhatu' | 'moon-sign' | 'nakshatra-finder'
  input_payload   JSONB NOT NULL,
  result_payload  JSONB,
  source          TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tool_submissions_slug       ON tool_submissions(tool_slug);
CREATE INDEX idx_tool_submissions_created_at ON tool_submissions(created_at DESC);

-- ============================================================
-- ORDERS
-- All paid orders: kundli reports + consultations
-- ============================================================
CREATE TABLE orders (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                UUID REFERENCES leads(id) ON DELETE SET NULL,
  kundli_submission_id   UUID REFERENCES kundli_submissions(id) ON DELETE SET NULL,

  -- Product
  product_type           TEXT NOT NULL,
  -- 'kundli_report' | 'consultation_15' | 'consultation_full'
  product_name           TEXT NOT NULL,
  amount_paise           INTEGER NOT NULL,   -- always in paise

  -- Customer details
  full_name              TEXT NOT NULL,
  phone                  TEXT NOT NULL,
  email                  TEXT,

  -- Birth data (required for kundli report, optional for consultation)
  dob                    DATE,
  tob                    TIME,
  pob                    TEXT,

  -- Consultation-specific
  problem_summary        TEXT,
  preferred_slot_note    TEXT,      -- free text from user

  -- Razorpay
  razorpay_order_id      TEXT UNIQUE,
  razorpay_payment_id    TEXT,
  razorpay_signature     TEXT,
  payment_verified       BOOLEAN DEFAULT FALSE,

  -- Status
  payment_status         TEXT NOT NULL DEFAULT 'initiated',
  -- 'initiated' | 'paid' | 'failed' | 'abandoned'
  order_status           TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'processing' | 'completed' | 'refunded' | 'cancelled'

  -- Attribution
  source_funnel          TEXT,
  -- 'tool_to_kundli' | 'direct_kundli' | 'direct_report' | 'direct_consultation'
  source_page            TEXT,
  utm_source             TEXT,
  utm_medium             TEXT,
  utm_campaign           TEXT,
  referrer               TEXT,

  -- Internal ops
  admin_notes            TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_payment_status   ON orders(payment_status);
CREATE INDEX idx_orders_product_type     ON orders(product_type);
CREATE INDEX idx_orders_razorpay_order   ON orders(razorpay_order_id);
CREATE INDEX idx_orders_phone            ON orders(phone);
CREATE INDEX idx_orders_created_at       ON orders(created_at DESC);

-- ============================================================
-- ABANDONED CHECKOUTS
-- Captured server-side when user hits /checkout/*
-- Separate from orders for clean abandoned visibility
-- ============================================================
CREATE TABLE abandoned_checkouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_type    TEXT NOT NULL,
  full_name       TEXT,
  phone           TEXT,
  email           TEXT,
  source_funnel   TEXT,
  source_page     TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  captured_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_abandoned_captured_at  ON abandoned_checkouts(captured_at DESC);
CREATE INDEX idx_abandoned_product_type ON abandoned_checkouts(product_type);

-- ============================================================
-- CONSULTATIONS
-- One record per consultation booking (linked to order)
-- ============================================================
CREATE TABLE consultations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  consultation_type   TEXT NOT NULL,     -- '15min' | 'full'
  problem_summary     TEXT,
  preferred_slot_raw  TEXT,
  assigned_slot       TIMESTAMPTZ,       -- set manually by admin
  status              TEXT NOT NULL DEFAULT 'pending_contact',
  -- 'pending_contact' | 'scheduled' | 'completed' | 'cancelled'
  admin_notes         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_order_id  ON consultations(order_id);
CREATE INDEX idx_consultations_status    ON consultations(status);
CREATE INDEX idx_consultations_created   ON consultations(created_at DESC);

-- ============================================================
-- SUPPORT REQUESTS
-- ============================================================
CREATE TABLE support_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  phone             TEXT,
  email             TEXT,
  order_reference   TEXT,              -- user-typed, optional
  subject           TEXT NOT NULL,
  message           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open',
  -- 'open' | 'in_progress' | 'resolved'
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_status     ON support_requests(status);
CREATE INDEX idx_support_created_at ON support_requests(created_at DESC);

-- ============================================================
-- TESTIMONIALS
-- Managed entirely from admin panel
-- ============================================================
CREATE TABLE testimonials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name   TEXT NOT NULL,
  location        TEXT,
  rating          INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  content         TEXT NOT NULL,
  product_type    TEXT,              -- 'kundli_report' | 'consultation_15' | 'consultation_full' | null (general)
  is_approved     BOOLEAN NOT NULL DEFAULT FALSE,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_approved ON testimonials(is_approved);
CREATE INDEX idx_testimonials_order    ON testimonials(display_order);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_updated_at
  BEFORE UPDATE ON support_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- Public can INSERT only. Admins (service role) have full access.
-- ============================================================
ALTER TABLE leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE kundli_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials       ENABLE ROW LEVEL SECURITY;

-- Public anon: INSERT allowed (form submissions)
-- All SELECTs go through server-side service role (admin panel / API routes)

CREATE POLICY "anon_insert_leads"
  ON leads FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_kundli"
  ON kundli_submissions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_tools"
  ON tool_submissions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_support"
  ON support_requests FOR INSERT TO anon WITH CHECK (true);

-- Testimonials: public can read approved ones
CREATE POLICY "public_read_approved_testimonials"
  ON testimonials FOR SELECT TO anon
  USING (is_approved = true);
