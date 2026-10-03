-- BAYAN schema drift repair and analytics
-- Safe on databases where these columns already exist because deployment-time
-- runtime guards also tolerate already-applied changes.
ALTER TABLE visitor_contributions ADD COLUMN reviewer_note TEXT;
ALTER TABLE visitor_contributions ADD COLUMN reviewed_at TEXT;

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
