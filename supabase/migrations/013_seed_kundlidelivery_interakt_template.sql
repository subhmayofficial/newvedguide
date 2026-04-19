-- Preset Interakt template for paid kundli WhatsApp (body {{1}} = name, button URL {{1}}).
-- Safe to re-run: upserts by template name.

BEGIN;

INSERT INTO public.admin_interakt_templates (
  name,
  language_code,
  header_labels_json,
  body_labels_json,
  button_value_labels_json,
  button_payload_labels_json,
  file_name_required,
  notes,
  source,
  is_active
) VALUES (
  'kundlidelivery_bt',
  'hi',
  '[]'::jsonb,
  '["Customer name (body {{1}})"]'::jsonb,
  '[{"buttonIndex": "0", "label": "Button link (URL {{1}})"}]'::jsonb,
  '[]'::jsonb,
  false,
  'Matches INTERAKT_KUNDLI_* defaults. Paid kundli orders auto-send uses the same shape.',
  'seed',
  true
)
ON CONFLICT (name) DO UPDATE SET
  language_code = EXCLUDED.language_code,
  header_labels_json = EXCLUDED.header_labels_json,
  body_labels_json = EXCLUDED.body_labels_json,
  button_value_labels_json = EXCLUDED.button_value_labels_json,
  button_payload_labels_json = EXCLUDED.button_payload_labels_json,
  file_name_required = EXCLUDED.file_name_required,
  notes = EXCLUDED.notes,
  is_active = true,
  updated_at = NOW();

COMMIT;
