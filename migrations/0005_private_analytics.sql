-- BAYAN private owner analytics
CREATE TABLE IF NOT EXISTS bayan_analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  query TEXT,
  language TEXT NOT NULL DEFAULT 'ar',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bayan_analytics_time ON bayan_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bayan_analytics_type_time ON bayan_analytics_events(event_type,created_at DESC);
