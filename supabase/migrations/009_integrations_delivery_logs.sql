-- Integration delivery logs for WhatsApp (Interakt) + email providers (SMTP/legacy)
-- Stores full request/response trail for debugging and audit in admin panel

BEGIN;

CREATE TABLE IF NOT EXISTS integration_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  channel TEXT NOT NULL,
  event_name TEXT NOT NULL,
  status TEXT NOT NULL,
  trigger_source TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  request_url TEXT,
  request_method TEXT NOT NULL DEFAULT 'POST',
  request_headers_json JSONB,
  request_body_json JSONB,
  response_status INTEGER,
  response_headers_json JSONB,
  response_body TEXT,
  error_message TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_deliveries_created_at
  ON integration_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_deliveries_provider
  ON integration_deliveries(provider);
CREATE INDEX IF NOT EXISTS idx_integration_deliveries_status
  ON integration_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_integration_deliveries_order_id
  ON integration_deliveries(order_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'integration_deliveries_provider_chk'
      AND conrelid = 'integration_deliveries'::regclass
  ) THEN
    ALTER TABLE integration_deliveries
      ADD CONSTRAINT integration_deliveries_provider_chk
      CHECK (provider IN ('interakt', 'make'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'integration_deliveries_channel_chk'
      AND conrelid = 'integration_deliveries'::regclass
  ) THEN
    ALTER TABLE integration_deliveries
      ADD CONSTRAINT integration_deliveries_channel_chk
      CHECK (channel IN ('whatsapp', 'email', 'webhook'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'integration_deliveries_status_chk'
      AND conrelid = 'integration_deliveries'::regclass
  ) THEN
    ALTER TABLE integration_deliveries
      ADD CONSTRAINT integration_deliveries_status_chk
      CHECK (status IN ('success', 'failed', 'skipped'));
  END IF;
END
$$;

COMMENT ON TABLE integration_deliveries IS
  'Outbound delivery logs for Interakt WhatsApp and SMTP/legacy email transports.';

COMMENT ON COLUMN integration_deliveries.trigger_source IS
  'Origin of trigger, e.g. payment_success_auto or admin_webhook_test';

COMMENT ON COLUMN integration_deliveries.request_headers_json IS
  'Sanitized headers used in outbound API call (secrets masked).';

COMMENT ON COLUMN integration_deliveries.response_body IS
  'Raw response body captured for debugging (truncated in app layer if required).';

COMMIT;
