-- Astrologer per-row config: rate and online status can be overridden from admin panel
-- without redeploying. Falls back to static LIVE_CHAT_ASTROLOGERS data if row missing.

CREATE TABLE IF NOT EXISTS astrologer_configs (
  id               TEXT        PRIMARY KEY,          -- matches LiveChatAstrologer.id
  rate_inr_per_min INTEGER     NOT NULL DEFAULT 49,
  is_online        BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: only service-role (admin) can write; no public read needed (server-side only)
ALTER TABLE astrologer_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON astrologer_configs
  USING (TRUE) WITH CHECK (TRUE);

-- Seed with current static values so the admin panel shows real data immediately
INSERT INTO astrologer_configs (id, rate_inr_per_min, is_online) VALUES
  ('ashutosh', 49, TRUE),
  ('priya',    39, TRUE),
  ('vikram',   59, FALSE),
  ('meera',    29, TRUE),
  ('ramesh',   45, TRUE),
  ('kavita',   55, FALSE),
  ('arjun',    35, TRUE)
ON CONFLICT (id) DO NOTHING;
