-- BAYAN manager control plane
CREATE TABLE IF NOT EXISTS bayan_manager_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bayan_manager_settings_updated
  ON bayan_manager_settings(updated_at DESC);
