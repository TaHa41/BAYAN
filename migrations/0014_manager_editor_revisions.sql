-- BAYAN 2026-10 manager editor and revision history
CREATE TABLE IF NOT EXISTS article_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  action TEXT NOT NULL,
  editor TEXT NOT NULL DEFAULT 'BAYAN_MANAGER',
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_article_revisions_slug_created
  ON article_revisions(slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_revisions_created
  ON article_revisions(created_at DESC);
