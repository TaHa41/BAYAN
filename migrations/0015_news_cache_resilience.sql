-- BAYAN 2026-10 resilient news cache
CREATE TABLE IF NOT EXISTS news_cache (
  cache_key TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  provider TEXT NOT NULL,
  articles_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_news_cache_language_updated ON news_cache(language, updated_at DESC);
