-- BAYAN 2026-10 manager editor and revision history
CREATE TABLE IF NOT EXISTS article_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  sources_json TEXT NOT NULL DEFAULT '[]',
  action TEXT NOT NULL DEFAULT 'EDIT',
  editor TEXT NOT NULL DEFAULT 'BAYAN_MANAGER',
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_article_revisions_slug_created ON article_revisions(article_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_revisions_created ON article_revisions(created_at DESC);
