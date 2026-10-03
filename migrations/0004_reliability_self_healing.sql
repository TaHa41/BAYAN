-- BAYAN reliability and self-healing
ALTER TABLE content_queue ADD COLUMN next_attempt_at TEXT;

CREATE TABLE IF NOT EXISTS runtime_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checked_at TEXT NOT NULL,
  healthy INTEGER NOT NULL DEFAULT 0,
  details_json TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_runtime_audits_checked ON runtime_audits(checked_at DESC);

CREATE TABLE IF NOT EXISTS repair_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signature TEXT NOT NULL UNIQUE,
  context TEXT NOT NULL,
  error_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_action TEXT,
  diagnosis TEXT,
  next_attempt_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_status_next ON repair_jobs(status,next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_content_queue_retry ON content_queue(status,next_attempt_at,priority);

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
