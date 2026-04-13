-- Report language preference for paid kundli (Hindi / English)
ALTER TABLE birth_details
  ADD COLUMN IF NOT EXISTS report_language TEXT;

COMMENT ON COLUMN birth_details.report_language IS 'Customer preference: hindi | english';
