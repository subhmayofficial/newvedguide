-- Consultation-specific structured fields on orders
-- Primary source moving forward: orders.consultation_type / orders.session_note
-- Backfill source: order_items.metadata_json and events.metadata_json

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS consultation_type TEXT,
  ADD COLUMN IF NOT EXISTS session_note TEXT;

COMMENT ON COLUMN orders.consultation_type IS
  'Consultation mode selected at checkout: chat | call | video_call';
COMMENT ON COLUMN orders.session_note IS
  'Optional session focus entered by customer during checkout';

-- Backfill from order_items metadata (preferred source)
UPDATE orders o
SET consultation_type = (
  SELECT oi.metadata_json->>'consultation_type'
  FROM order_items oi
  WHERE oi.order_id = o.id
    AND oi.metadata_json IS NOT NULL
    AND (oi.metadata_json ? 'consultation_type')
  ORDER BY oi.created_at DESC
  LIMIT 1
)
WHERE o.product_slug IN ('consultation-15min', 'consultation-45min')
  AND o.consultation_type IS NULL
  AND EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = o.id
      AND oi.metadata_json IS NOT NULL
      AND (oi.metadata_json ? 'consultation_type')
  );

UPDATE orders o
SET session_note = (
  SELECT oi.metadata_json->>'session_note'
  FROM order_items oi
  WHERE oi.order_id = o.id
    AND oi.metadata_json IS NOT NULL
    AND (oi.metadata_json ? 'session_note')
  ORDER BY oi.created_at DESC
  LIMIT 1
)
WHERE o.product_slug IN ('consultation-15min', 'consultation-45min')
  AND o.session_note IS NULL
  AND EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = o.id
      AND oi.metadata_json IS NOT NULL
      AND (oi.metadata_json ? 'session_note')
  );

-- Fallback backfill from payment_initiated events metadata
UPDATE orders o
SET consultation_type = (
  SELECT e.metadata_json->>'consultation_type'
  FROM events e
  WHERE e.order_id = o.id
    AND e.event_name = 'payment_initiated'
    AND e.metadata_json IS NOT NULL
    AND (e.metadata_json ? 'consultation_type')
  ORDER BY e.created_at DESC
  LIMIT 1
)
WHERE o.product_slug IN ('consultation-15min', 'consultation-45min')
  AND o.consultation_type IS NULL
  AND EXISTS (
    SELECT 1
    FROM events e
    WHERE e.order_id = o.id
      AND e.event_name = 'payment_initiated'
      AND e.metadata_json IS NOT NULL
      AND (e.metadata_json ? 'consultation_type')
  );

UPDATE orders o
SET session_note = (
  SELECT e.metadata_json->>'session_note'
  FROM events e
  WHERE e.order_id = o.id
    AND e.event_name = 'payment_initiated'
    AND e.metadata_json IS NOT NULL
    AND (e.metadata_json ? 'session_note')
  ORDER BY e.created_at DESC
  LIMIT 1
)
WHERE o.product_slug IN ('consultation-15min', 'consultation-45min')
  AND o.session_note IS NULL
  AND EXISTS (
    SELECT 1
    FROM events e
    WHERE e.order_id = o.id
      AND e.event_name = 'payment_initiated'
      AND e.metadata_json IS NOT NULL
      AND (e.metadata_json ? 'session_note')
  );

-- Normalize mode text before adding strict checks
UPDATE orders
SET consultation_type = lower(trim(consultation_type))
WHERE consultation_type IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_consultation_type_chk'
      AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_consultation_type_chk
      CHECK (
        consultation_type IS NULL
        OR consultation_type IN ('chat', 'call', 'video_call')
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_orders_consultation_type
  ON orders (consultation_type)
  WHERE product_slug IN ('consultation-15min', 'consultation-45min');

COMMIT;
