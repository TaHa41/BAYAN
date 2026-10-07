CREATE TABLE IF NOT EXISTS news_cache(
  language TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_news_cache_updated ON news_cache(updated_at);