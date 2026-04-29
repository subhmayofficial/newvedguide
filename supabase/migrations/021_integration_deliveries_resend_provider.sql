-- Allow Resend provider in integration delivery logs while keeping historical SMTP rows valid.

BEGIN;

ALTER TABLE integration_deliveries
  DROP CONSTRAINT IF EXISTS integration_deliveries_provider_chk;

ALTER TABLE integration_deliveries
  ADD CONSTRAINT integration_deliveries_provider_chk
  CHECK (provider IN ('interakt', 'make', 'smtp', 'resend'));

COMMIT;
