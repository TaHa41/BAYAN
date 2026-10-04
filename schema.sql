-- BAYAN D1 schema
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  query TEXT NOT NULL,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  sources_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  freshness_score REAL NOT NULL DEFAULT 1,
  next_review_at TEXT,
  language TEXT NOT NULL DEFAULT 'ar',
  title_en TEXT,
  summary_en TEXT,
  body_en TEXT
);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_section_created
  ON knowledge_articles(section, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_query
  ON knowledge_articles(query);
CREATE TABLE IF NOT EXISTS knowledge_entities (
  entity_key TEXT PRIMARY KEY, entity_type TEXT NOT NULL, label TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_key TEXT NOT NULL,
  to_key TEXT NOT NULL,
  relation TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(from_key, to_key, relation)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_from ON knowledge_edges(from_key);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_to ON knowledge_edges(to_key);
CREATE TABLE IF NOT EXISTS content_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT, topic TEXT NOT NULL, section TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar', priority INTEGER NOT NULL DEFAULT 50,
  attempts INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'QUEUED',
  created_at TEXT NOT NULL, processed_at TEXT, next_attempt_at TEXT
);
CREATE TABLE IF NOT EXISTS visitor_profiles (
  visitor_id TEXT PRIMARY KEY, language TEXT NOT NULL DEFAULT 'ar',
  interests_json TEXT NOT NULL DEFAULT '[]', first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS visitor_interest_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, section TEXT NOT NULL,
  event_type TEXT NOT NULL, weight REAL NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
  FOREIGN KEY(visitor_id) REFERENCES visitor_profiles(visitor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_interest_events_visitor_time ON visitor_interest_events(visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interest_events_section_time ON visitor_interest_events(section, created_at DESC);
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
CREATE INDEX IF NOT EXISTS idx_content_queue_status_priority ON content_queue(status,priority DESC,created_at ASC);

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


CREATE TABLE IF NOT EXISTS knowledge_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar',
  intent TEXT,
  section TEXT,
  status TEXT NOT NULL DEFAULT 'DISCOVERED',
  article_slug TEXT,
  source_count INTEGER NOT NULL DEFAULT 0,
  provider_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_knowledge_searches_query_time ON knowledge_searches(query,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_searches_time ON knowledge_searches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_language_status ON knowledge_articles(language,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_queue_language_status ON content_queue(language,status,next_attempt_at);
CREATE TABLE IF NOT EXISTS saved_articles (visitor_id TEXT NOT NULL, article_slug TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(visitor_id, article_slug));
CREATE INDEX IF NOT EXISTS idx_saved_articles_visitor ON saved_articles(visitor_id, created_at DESC);
CREATE TABLE IF NOT EXISTS article_revisions (id INTEGER PRIMARY KEY AUTOINCREMENT, article_slug TEXT NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, body TEXT NOT NULL, sources_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_article_revisions_slug_time ON article_revisions(article_slug, created_at DESC);
CREATE TABLE IF NOT EXISTS user_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, request_type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, source TEXT, status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_user_requests_status_time ON user_requests(status, created_at DESC);
CREATE TABLE IF NOT EXISTS notification_preferences (visitor_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, language TEXT NOT NULL DEFAULT 'ar', topics_json TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL);
