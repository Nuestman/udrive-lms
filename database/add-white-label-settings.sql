-- White Label schema updates

-- 1) Ensure tenants table has white_label_settings JSONB column
ALTER TABLE IF EXISTS tenants
  ADD COLUMN IF NOT EXISTS white_label_settings JSONB DEFAULT '{}'::jsonb;

-- Optional: index for querying specific keys frequently
-- CREATE INDEX IF NOT EXISTS idx_tenants_white_label_settings ON tenants USING gin (white_label_settings);

-- 2) Ensure system_settings table exists (used for system-wide white label)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upsert example (for reference):
-- INSERT INTO system_settings (key, value)
-- VALUES ('white_label', '{}'::jsonb)
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


