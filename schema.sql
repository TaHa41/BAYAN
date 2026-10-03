-- BAYAN D1 schema
CREATE TABLE IF NOT EXISTS knowledge_articles (
  slug TEXT PRIMARY KEY, query TEXT NOT NULL, section TEXT NOT NULL,
  title TEXT NOT NULL, summary TEXT NOT NULL, body TEXT NOT NULL,
  sources_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'PUBLISHED',
  freshness_score REAL, next_review_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge_entities (
  entity_key TEXT PRIMARY KEY, entity_type TEXT NOT NULL, label TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge_edges (
  from_key TEXT NOT NULL, to_key TEXT NOT NULL, relation TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY(from_key,to_key,relation)
);
CREATE TABLE IF NOT EXISTS content_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT, topic TEXT NOT NULL, section TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar', priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'QUEUED',
  created_at TEXT NOT NULL, processed_at TEXT
);
CREATE TABLE IF NOT EXISTS visitor_profiles (
  visitor_id TEXT PRIMARY KEY, language TEXT NOT NULL DEFAULT 'ar',
  interests_json TEXT NOT NULL DEFAULT '[]', first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS visitor_interest_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, section TEXT NOT NULL,
  event_type TEXT NOT NULL, weight INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interest_visitor_section ON visitor_interest_events(visitor_id,section,created_at DESC);
CREATE TABLE IF NOT EXISTS visitor_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, title TEXT NOT NULL,
  body TEXT NOT NULL, source TEXT, status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  reviewer_note TEXT, created_at TEXT NOT NULL, reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contributions_status_created ON visitor_contributions(status,created_at DESC);

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
