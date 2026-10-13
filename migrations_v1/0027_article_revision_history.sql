-- Immutable manager and automated-publishing revision snapshots.
CREATE TABLE IF NOT EXISTS article_revision_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_slug TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar',
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL DEFAULT 'world',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  image_url TEXT,
  image_alt TEXT,
  sources_json TEXT NOT NULL DEFAULT '[]',
  action TEXT NOT NULL DEFAULT 'EDIT',
  editor TEXT NOT NULL DEFAULT 'BAYAN_MANAGER',
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_article_revision_history_slug_language_created
  ON article_revision_history(article_slug, language, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_revision_history_created
  ON article_revision_history(created_at DESC);
