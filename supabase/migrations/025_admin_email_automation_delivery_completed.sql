-- Seed automation for delivery-completed email on final report send.

BEGIN;

INSERT INTO public.admin_email_automations (
  automation_key,
  label,
  description,
  is_enabled,
  template_name
)
VALUES (
  'kundli_delivery_completed',
  'Kundli delivery completed',
  'Send email after final paid-kundli report delivery is completed.',
  TRUE,
  'kundli_delivery_completed'
)
ON CONFLICT (automation_key) DO NOTHING;

COMMIT;
