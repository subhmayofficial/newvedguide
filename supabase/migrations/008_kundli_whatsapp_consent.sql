-- Save explicit WhatsApp consent for free kundli submissions
ALTER TABLE kundli_submissions
  ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN kundli_submissions.whatsapp_consent IS
  'User consent for receiving free kundli result and updates on WhatsApp';
