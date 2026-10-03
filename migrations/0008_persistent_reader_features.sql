-- BAYAN persistent reader features
CREATE TABLE IF NOT EXISTS saved_articles (
  visitor_id TEXT NOT NULL,
  article_slug TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(visitor_id, article_slug)
);
CREATE INDEX IF NOT EXISTS idx_saved_articles_visitor ON saved_articles(visitor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS article_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  sources_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_article_revisions_slug_time ON article_revisions(article_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS user_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_requests_status_time ON user_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
  visitor_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'ar',
  topics_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
